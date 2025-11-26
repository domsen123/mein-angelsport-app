import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetPermitOptionsByClubIdQuerySchema = z.object({
  clubId: ulidSchema,
})

export type GetPermitOptionsByClubIdQuery = z.infer<typeof GetPermitOptionsByClubIdQuerySchema>

export const _getPermitOptionsByClubId = async (
  input: GetPermitOptionsByClubIdQuery,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetPermitOptionsByClubIdQuerySchema.parse(input)

  // Get all permits with their options for the club
  const permits = await db.query.permit.findMany({
    where: eq(permit.clubId, data.clubId),
    with: {
      options: true,
    },
    orderBy: (permit, { asc }) => [asc(permit.name)],
  })

  // Flatten to permit options with permit info
  return permits.flatMap(p =>
    p.options.map(option => ({
      id: option.id,
      name: option.name,
      description: option.description,
      permitId: p.id,
      permitName: p.name,
    })),
  )
}, tx)

export const getPermitOptionsByClubId = async (
  input: GetPermitOptionsByClubIdQuery,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getPermitOptionsByClubId(input, context, db)
}, tx)

export type GetPermitOptionsByClubIdResponse = Awaited<ReturnType<typeof _getPermitOptionsByClubId>>
export type PermitOptionItem = GetPermitOptionsByClubIdResponse[number]
