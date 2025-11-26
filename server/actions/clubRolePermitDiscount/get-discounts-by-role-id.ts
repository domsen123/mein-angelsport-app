import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubRolePermitDiscount } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetDiscountsByRoleIdQuerySchema = z.object({
  clubId: ulidSchema,
  roleId: ulidSchema,
})

export type GetDiscountsByRoleIdQuery = z.infer<typeof GetDiscountsByRoleIdQuerySchema>

export const _getDiscountsByRoleId = async (
  input: GetDiscountsByRoleIdQuery,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetDiscountsByRoleIdQuerySchema.parse(input)

  return db.query.clubRolePermitDiscount.findMany({
    where: eq(clubRolePermitDiscount.clubRoleId, data.roleId),
    with: {
      permitOption: {
        with: {
          permit: true,
        },
      },
    },
  })
}, tx)

export const getDiscountsByRoleId = async (
  input: GetDiscountsByRoleIdQuery,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getDiscountsByRoleId(input, context, db)
}, tx)

export type GetDiscountsByRoleIdResponse = Awaited<ReturnType<typeof _getDiscountsByRoleId>>
export type DiscountItem = GetDiscountsByRoleIdResponse[number]
