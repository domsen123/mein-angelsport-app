import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { APIError } from 'better-auth'
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { club, clubMember, clubOrder, permitInstance, permitOptionPeriod } from '~~/server/database/schema'
import { getCurrentSalePeriod } from '~~/server/utils/sale-period'
import { isExecutorClubMember } from '../clubMember/checks/is-executor-club-member'

export const ReservePermitsSchema = z.object({
  clubId: ulidSchema,
  memberId: ulidSchema,
  permits: z.array(z.object({
    optionPeriodId: ulidSchema,
  })).min(1),
})

export type ReservePermitsInput = z.infer<typeof ReservePermitsSchema>

const RESERVATION_MINUTES = 5

export const reservePermits = async (
  input: ReservePermitsInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = ReservePermitsSchema.parse(input)
  const { clubId, memberId, permits: permitRequests } = data

  const executorMember = await isExecutorClubMember(clubId, context, db)

  // Check if executor can reserve for this member
  if (executorMember.id !== memberId) {
    const targetMember = await db.query.clubMember.findFirst({
      where: and(
        eq(clubMember.id, memberId),
        eq(clubMember.clubId, clubId),
      ),
      columns: {
        managedBy: true,
      },
    })

    if (!targetMember || targetMember.managedBy !== executorMember.id) {
      throw new APIError('FORBIDDEN', {
        message: 'Sie haben keine Berechtigung, für dieses Mitglied zu reservieren.',
      })
    }
  }

  // Get club settings for sale period
  const clubData = await db.query.club.findFirst({
    where: eq(club.id, clubId),
    columns: {
      permitSaleStart: true,
      permitSaleEnd: true,
    },
  })

  // Check for existing orders with same permit periods in current sale period
  const requestedPeriodIds = permitRequests.map(p => p.optionPeriodId)

  // Build query conditions for existing orders
  const orderConditions = [
    eq(clubOrder.clubId, clubId),
    eq(clubOrder.memberId, memberId),
    inArray(clubOrder.status, ['PENDING', 'PAID', 'FULFILLED']),
  ]

  // Add sale period filter if configured
  const salePeriod = getCurrentSalePeriod(
    clubData?.permitSaleStart ?? null,
    clubData?.permitSaleEnd ?? null,
  )
  if (salePeriod) {
    orderConditions.push(gte(clubOrder.createdAt, salePeriod.start))
    orderConditions.push(lte(clubOrder.createdAt, salePeriod.end))
  }

  // Query existing orders to find owned permit periods
  const existingOrders = await db.query.clubOrder.findMany({
    where: and(...orderConditions),
    with: {
      items: {
        with: {
          permitInstance: {
            columns: {
              permitOptionPeriodId: true,
            },
          },
        },
      },
    },
  })

  // Collect owned period IDs
  const ownedPeriodIds = new Set<string>()
  for (const order of existingOrders) {
    for (const item of order.items) {
      if (item.permitInstance?.permitOptionPeriodId) {
        ownedPeriodIds.add(item.permitInstance.permitOptionPeriodId)
      }
    }
  }

  // Check if any requested period is already owned
  for (const periodId of requestedPeriodIds) {
    if (ownedPeriodIds.has(periodId)) {
      throw new APIError('CONFLICT', {
        message: 'Sie haben bereits einen Erlaubnisschein für diesen Zeitraum erworben.',
      })
    }
  }

  // First, release any existing reservations by this member
  await db
    .update(permitInstance)
    .set({
      status: 'available',
      reservedBy: null,
      reservedAt: null,
    })
    .where(
      and(
        eq(permitInstance.reservedBy, executorMember.id),
        eq(permitInstance.status, 'reserved'),
      ),
    )

  const reservedInstances: {
    permitInstanceId: string
    permitId: string
    permitName: string
    optionId: string
    optionName: string
    periodId: string
    priceCents: number
  }[] = []

  const reservedAt = new Date()
  const expiresAt = new Date(reservedAt.getTime() + RESERVATION_MINUTES * 60 * 1000)

  // Reserve one instance per requested option period
  for (const req of permitRequests) {
    // Verify the period belongs to this club and get permit/option info
    const periodInfo = await db.query.permitOptionPeriod.findFirst({
      where: eq(permitOptionPeriod.id, req.optionPeriodId),
      with: {
        option: {
          columns: {
            id: true,
            name: true,
          },
          with: {
            permit: {
              columns: {
                id: true,
                name: true,
                clubId: true,
              },
            },
          },
        },
      },
    })

    if (!periodInfo || periodInfo.option.permit.clubId !== clubId) {
      throw new APIError('BAD_REQUEST', {
        message: `Ungültige Erlaubnisschein-Periode: ${req.optionPeriodId}`,
      })
    }

    // Find an available instance and reserve it atomically
    // Use a subquery to find and update in one operation
    const updated = await db
      .update(permitInstance)
      .set({
        status: 'reserved',
        reservedBy: executorMember.id,
        reservedAt,
      })
      .where(
        and(
          eq(permitInstance.permitOptionPeriodId, req.optionPeriodId),
          eq(permitInstance.status, 'available'),
          // Only update one instance by using a subquery
          eq(
            permitInstance.id,
            sql`(
              SELECT id FROM permit_instance
              WHERE permit_option_period_id = ${req.optionPeriodId}
              AND status = 'available'
              LIMIT 1
              FOR UPDATE SKIP LOCKED
            )`,
          ),
        ),
      )
      .returning({
        id: permitInstance.id,
      })

    if (updated.length === 0) {
      // Rollback all reservations if any fails
      await db
        .update(permitInstance)
        .set({
          status: 'available',
          reservedBy: null,
          reservedAt: null,
        })
        .where(
          and(
            eq(permitInstance.reservedBy, executorMember.id),
            eq(permitInstance.status, 'reserved'),
          ),
        )

      throw new APIError('CONFLICT', {
        message: `Keine verfügbare Erlaubnisschein-Karte für "${periodInfo.option.permit.name} - ${periodInfo.option.name}" gefunden.`,
      })
    }

    const reservedInstance = updated[0]
    if (reservedInstance) {
      reservedInstances.push({
        permitInstanceId: reservedInstance.id,
        permitId: periodInfo.option.permit.id,
        permitName: periodInfo.option.permit.name,
        optionId: periodInfo.option.id,
        optionName: periodInfo.option.name ?? '',
        periodId: periodInfo.id,
        priceCents: Number(periodInfo.priceCents),
      })
    }
  }

  return {
    reservedInstances,
    reservedAt: reservedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }
}, tx)

// Response types for frontend usage
export type ReservePermitsResponse = Awaited<ReturnType<typeof reservePermits>>
