import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetPermitByIdCommandSchema = z.object({
  clubId: ulidSchema,
  permitId: ulidSchema,
})

export type GetPermitByIdCommand = z.infer<typeof GetPermitByIdCommandSchema>

export const _getPermitById = async (
  input: GetPermitByIdCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetPermitByIdCommandSchema.parse(input)
  const { clubId, permitId } = data

  const result = await db.query.permit.findFirst({
    where: and(eq(permit.id, permitId), eq(permit.clubId, clubId)),
    with: {
      waters: {
        with: {
          water: true,
        },
      },
      options: {
        with: {
          periods: true,
        },
        orderBy: (options, { asc }) => [asc(options.createdAt)],
      },
    },
  })

  if (!result) {
    throw new Error('Permit not found')
  }

  return result
}, tx)

export const getPermitById = async (
  input: GetPermitByIdCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getPermitById(input, context, db)
}, tx)

// Response types for frontend usage
export type GetPermitByIdResponse = Awaited<ReturnType<typeof _getPermitById>>
