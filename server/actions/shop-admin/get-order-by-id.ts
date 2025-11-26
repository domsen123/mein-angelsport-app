import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubOrder } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetOrderByIdCommandSchema = z.object({
  clubId: ulidSchema,
  orderId: ulidSchema,
})

export type GetOrderByIdCommand = z.infer<typeof GetOrderByIdCommandSchema>

export const _getOrderById = async (
  input: GetOrderByIdCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetOrderByIdCommandSchema.parse(input)

  const order = await db.query.clubOrder.findFirst({
    where: and(
      eq(clubOrder.clubId, data.clubId),
      eq(clubOrder.id, data.orderId),
    ),
    with: {
      member: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      buyer: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        with: {
          permitInstance: {
            with: {
              optionPeriod: {
                with: {
                  option: {
                    columns: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          shopItem: true,
        },
      },
    },
  })

  if (!order) {
    throw createError({
      statusCode: 404,
      message: 'Bestellung nicht gefunden',
    })
  }

  return order
}, tx)

export const getOrderById = async (
  input: GetOrderByIdCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getOrderById(input, context, db)
}, tx)

export type GetOrderByIdResponse = Awaited<ReturnType<typeof _getOrderById>>
