import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq, gte, lt } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { paginateQuery } from '~~/server/database/pagination'
import { clubOrder } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetOrdersCommandSchema = z.object({
  clubId: ulidSchema,
  pagination: paginationSchema,
  status: z.enum(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED']).optional(),
  year: z.number().int().optional(),
})

export type GetOrdersCommand = z.infer<typeof GetOrdersCommandSchema>

export const _getOrders = async (
  input: GetOrdersCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetOrdersCommandSchema.parse(input)
  const { clubId, pagination, status, year } = data

  // Build filters
  const filters = [eq(clubOrder.clubId, clubId)]

  if (status) {
    filters.push(eq(clubOrder.status, status))
  }

  if (year) {
    const startOfYear = new Date(year, 0, 1)
    const startOfNextYear = new Date(year + 1, 0, 1)
    filters.push(gte(clubOrder.createdAt, startOfYear))
    filters.push(lt(clubOrder.createdAt, startOfNextYear))
  }

  const baseFilter = and(...filters)

  const result = await paginateQuery(db, clubOrder, 'clubOrder', pagination, {
    searchableColumns: [clubOrder.orderNumber],
    sortableColumns: {
      orderNumber: clubOrder.orderNumber,
      status: clubOrder.status,
      totalCents: clubOrder.totalCents,
      createdAt: clubOrder.createdAt,
    },
    defaultSort: { column: clubOrder.createdAt, direction: 'desc' },
    baseFilter,
    with: {
      member: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      buyer: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return result
}, tx)

export const getOrders = async (
  input: GetOrdersCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getOrders(input, context, db)
}, tx)

export type GetOrdersResponse = Awaited<ReturnType<typeof _getOrders>>
export type OrderListItem = GetOrdersResponse['items'][number]
