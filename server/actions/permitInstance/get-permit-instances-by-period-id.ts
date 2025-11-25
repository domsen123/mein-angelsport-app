import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq, sql } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { paginateQuery } from '~~/server/database/pagination'
import { permit, permitInstance, permitOption, permitOptionPeriod } from '~~/server/database/schema'
import { paginationSchema } from '~~/server/utils/validation'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetPermitInstancesByPeriodIdCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
  optionId: ulidSchema,
  periodId: ulidSchema,
  pagination: paginationSchema,
})

export type GetPermitInstancesByPeriodIdCommand = z.infer<typeof GetPermitInstancesByPeriodIdCommandSchema>

const _getPermitInstancesByPeriodId = async (
  input: GetPermitInstancesByPeriodIdCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetPermitInstancesByPeriodIdCommandSchema.parse(input)

  // Run paginated query and status counts in parallel
  const [paginatedResult, statusCounts] = await Promise.all([
    paginateQuery(
      db,
      permitInstance,
      'permitInstance',
      data.pagination,
      {
        searchableColumns: [
          permitInstance.permitNumber,
          permitInstance.ownerName,
          permitInstance.ownerEmail,
        ],
        sortableColumns: {
          permitNumber: sql`CAST(${permitInstance.permitNumber} AS INTEGER)`,
          status: permitInstance.status,
          ownerName: permitInstance.ownerName,
          soldAt: permitInstance.soldAt,
          createdAt: permitInstance.createdAt,
        },
        defaultSort: {
          column: sql`CAST(${permitInstance.permitNumber} AS INTEGER)`,
          direction: 'asc',
        },
        baseFilter: eq(permitInstance.permitOptionPeriodId, data.periodId),
        with: {
          ownerMember: true,
          buyer: true,
        },
      },
    ),
    // Get status counts for all instances in this period (not paginated)
    Promise.all([
      db.$count(permitInstance, and(
        eq(permitInstance.permitOptionPeriodId, data.periodId),
        eq(permitInstance.status, 'available'),
      )),
      db.$count(permitInstance, and(
        eq(permitInstance.permitOptionPeriodId, data.periodId),
        eq(permitInstance.status, 'reserved'),
      )),
      db.$count(permitInstance, and(
        eq(permitInstance.permitOptionPeriodId, data.periodId),
        eq(permitInstance.status, 'sold'),
      )),
      db.$count(permitInstance, and(
        eq(permitInstance.permitOptionPeriodId, data.periodId),
        eq(permitInstance.status, 'cancelled'),
      )),
    ]),
  ])

  const [available, reserved, sold, cancelled] = statusCounts

  return {
    ...paginatedResult,
    stats: {
      available,
      reserved,
      sold,
      cancelled,
      total: paginatedResult.meta.totalItems,
    },
  }
}, tx)

export const getPermitInstancesByPeriodId = async (
  input: GetPermitInstancesByPeriodIdCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // Verify permit belongs to club
  const permitRecord = await db.query.permit.findFirst({
    where: eq(permit.id, input.permitId),
    columns: { clubId: true },
  })

  if (!permitRecord || permitRecord.clubId !== input.clubId) {
    throw new Error('Permit not found')
  }

  // Verify option belongs to permit
  const optionRecord = await db.query.permitOption.findFirst({
    where: eq(permitOption.id, input.optionId),
    columns: { permitId: true },
  })

  if (!optionRecord || optionRecord.permitId !== input.permitId) {
    throw new Error('Permit option not found')
  }

  // Verify period belongs to option
  const periodRecord = await db.query.permitOptionPeriod.findFirst({
    where: eq(permitOptionPeriod.id, input.periodId),
    columns: { permitOptionId: true },
  })

  if (!periodRecord || periodRecord.permitOptionId !== input.optionId) {
    throw new Error('Permit option period not found')
  }

  await isExecutorClubAdmin(input.clubId, context, db)
  return _getPermitInstancesByPeriodId(input, context, db)
}, tx)

// Export response types for client usage
export type GetPermitInstancesByPeriodIdResponse = Awaited<ReturnType<typeof _getPermitInstancesByPeriodId>>
export type PermitInstanceItem = GetPermitInstancesByPeriodIdResponse['items'][number]
