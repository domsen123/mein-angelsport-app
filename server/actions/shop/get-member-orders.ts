import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { club, clubMember, clubOrder } from '~~/server/database/schema'
import { getCurrentSalePeriod } from '~~/server/utils/sale-period'
import { isExecutorClubMember } from '../clubMember/checks/is-executor-club-member'

export const GetMemberOrdersSchema = z.object({
  clubId: ulidSchema,
  memberId: ulidSchema,
})

export type GetMemberOrdersInput = z.infer<typeof GetMemberOrdersSchema>

/**
 * Get a member's active orders for the current sale period.
 * Used to:
 * 1. Display existing orders when member is selected in shop
 * 2. Get list of owned permit period IDs for duplicate prevention
 *
 * Authorization: Executor must be the member themselves or manage them.
 */
export const getMemberOrders = async (
  input: GetMemberOrdersInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetMemberOrdersSchema.parse(input)
  const { clubId, memberId } = data

  // Verify executor is a club member
  const executorMember = await isExecutorClubMember(clubId, context, db)

  // Verify executor can access this member's orders (self or managed)
  if (executorMember.id !== memberId) {
    const targetMember = await db.query.clubMember.findFirst({
      where: and(
        eq(clubMember.id, memberId),
        eq(clubMember.clubId, clubId),
      ),
      columns: {
        id: true,
        managedBy: true,
      },
    })

    if (!targetMember) {
      throw createError({
        statusCode: 404,
        message: 'Mitglied nicht gefunden',
      })
    }

    if (targetMember.managedBy !== executorMember.id) {
      throw createError({
        statusCode: 403,
        message: 'Sie haben keinen Zugriff auf die Bestellungen dieses Mitglieds',
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

  if (!clubData) {
    throw createError({
      statusCode: 404,
      message: 'Verein nicht gefunden',
    })
  }

  // Calculate current sale period
  const salePeriod = getCurrentSalePeriod(
    clubData.permitSaleStart,
    clubData.permitSaleEnd,
  )

  // Build query conditions
  const conditions = [
    eq(clubOrder.clubId, clubId),
    eq(clubOrder.memberId, memberId),
    inArray(clubOrder.status, ['PENDING', 'PAID', 'FULFILLED']),
  ]

  // Add sale period filter if configured
  if (salePeriod) {
    conditions.push(gte(clubOrder.createdAt, salePeriod.start))
    conditions.push(lte(clubOrder.createdAt, salePeriod.end))
  }

  // Query orders with items
  const orders = await db.query.clubOrder.findMany({
    where: and(...conditions),
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
    orderBy: (order, { desc }) => desc(order.createdAt),
  })

  // Extract owned permit period IDs for duplicate checking
  const ownedPermitPeriodIds: string[] = []
  for (const order of orders) {
    for (const item of order.items) {
      if (item.permitInstance?.permitOptionPeriodId) {
        if (!ownedPermitPeriodIds.includes(item.permitInstance.permitOptionPeriodId)) {
          ownedPermitPeriodIds.push(item.permitInstance.permitOptionPeriodId)
        }
      }
    }
  }

  // Format orders for response
  const formattedOrders = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    totalCents: order.totalCents,
    items: order.items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      itemType: item.itemType,
      finalPriceCents: item.finalPriceCents,
      permitOptionPeriodId: item.permitInstance?.permitOptionPeriodId ?? null,
    })),
  }))

  return {
    orders: formattedOrders,
    ownedPermitPeriodIds,
    salePeriod: salePeriod
      ? {
          start: salePeriod.start.toISOString(),
          end: salePeriod.end.toISOString(),
        }
      : null,
  }
}, tx)

// Response types for frontend usage
export type GetMemberOrdersResponse = Awaited<ReturnType<typeof getMemberOrders>>
export type MemberOrder = GetMemberOrdersResponse['orders'][number]
