import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { APIError } from 'better-auth'
import { and, count, eq, gte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { club, permit, permitInstance, permitOptionPeriod } from '~~/server/database/schema'
import { isExecutorClubMember } from '../clubMember/checks/is-executor-club-member'

export const GetAvailablePermitsSchema = z.object({
  clubId: ulidSchema,
})

export type GetAvailablePermitsInput = z.infer<typeof GetAvailablePermitsSchema>

export const _getAvailablePermits = async (
  input: GetAvailablePermitsInput,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetAvailablePermitsSchema.parse(input)
  const { clubId } = data

  // Get club settings for permit sale period
  const clubData = await db.query.club.findFirst({
    where: eq(club.id, clubId),
    columns: {
      permitSaleStart: true,
      permitSaleEnd: true,
    },
  })

  if (!clubData) {
    throw new APIError('NOT_FOUND', {
      message: 'Verein nicht gefunden.',
    })
  }

  // Check if permit sale is active
  const today = new Date()
  const currentYear = today.getFullYear()
  const todayDDMM = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`

  let isSaleActive = true
  if (clubData.permitSaleStart && clubData.permitSaleEnd) {
    // Convert DD-MM to comparable format
    const startParts = clubData.permitSaleStart.split('-').map(Number)
    const endParts = clubData.permitSaleEnd.split('-').map(Number)
    const todayParts = todayDDMM.split('-').map(Number)

    const startDay = startParts[0] ?? 1
    const startMonth = startParts[1] ?? 1
    const endDay = endParts[0] ?? 31
    const endMonth = endParts[1] ?? 12
    const todayDay = todayParts[0] ?? 1
    const todayMonth = todayParts[1] ?? 1

    const startDate = new Date(currentYear, startMonth - 1, startDay)
    const endDate = new Date(currentYear, endMonth - 1, endDay)
    const todayDate = new Date(currentYear, todayMonth - 1, todayDay)

    // Handle year wrap-around (e.g., sale from Nov to Feb)
    if (startDate > endDate) {
      isSaleActive = todayDate >= startDate || todayDate <= endDate
    }
    else {
      isSaleActive = todayDate >= startDate && todayDate <= endDate
    }
  }

  // Get all permits with options and periods for current/future periods
  const permits = await db.query.permit.findMany({
    where: eq(permit.clubId, clubId),
    with: {
      options: {
        with: {
          periods: {
            where: gte(permitOptionPeriod.validTo, today),
            orderBy: (period, { asc }) => asc(period.validFrom),
          },
        },
      },
      waters: {
        with: {
          water: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  // Get availability counts for all periods
  const periodIds = permits.flatMap(p =>
    p.options.flatMap(o => o.periods.map(period => period.id)),
  )

  const availabilityCounts = periodIds.length > 0
    ? await db
        .select({
          periodId: permitInstance.permitOptionPeriodId,
          availableCount: count(),
        })
        .from(permitInstance)
        .where(
          and(
            sql`${permitInstance.permitOptionPeriodId} IN (${sql.join(periodIds.map(id => sql`${id}`), sql`, `)})`,
            eq(permitInstance.status, 'available'),
          ),
        )
        .groupBy(permitInstance.permitOptionPeriodId)
    : []

  const availabilityMap = new Map(
    availabilityCounts.map(a => [a.periodId, a.availableCount]),
  )

  // Transform the data
  const result = permits.map(p => ({
    id: p.id,
    name: p.name,
    waters: p.waters.map(w => ({
      id: w.water.id,
      name: w.water.name,
    })),
    options: p.options.map(o => ({
      id: o.id,
      name: o.name,
      description: o.description,
      periods: o.periods.map(period => ({
        id: period.id,
        validFrom: period.validFrom,
        validTo: period.validTo,
        priceCents: Number(period.priceCents),
        availableCount: availabilityMap.get(period.id) ?? 0,
      })),
    })),
  }))

  return {
    permits: result,
    isSaleActive,
    saleStart: clubData.permitSaleStart,
    saleEnd: clubData.permitSaleEnd,
  }
}, tx)

export const getAvailablePermits = async (
  input: GetAvailablePermitsInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubMember(input.clubId, context, db)
  return _getAvailablePermits(input, context, db)
}, tx)

// Response types for frontend usage
export type GetAvailablePermitsResponse = Awaited<ReturnType<typeof _getAvailablePermits>>
export type AvailablePermit = GetAvailablePermitsResponse['permits'][number]
export type AvailablePermitOption = AvailablePermit['options'][number]
export type AvailablePermitPeriod = AvailablePermitOption['periods'][number]
