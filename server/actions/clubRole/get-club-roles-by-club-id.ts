import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { isExecutorClubAdmin } from './checks/is-executor-club-admin'

export const GetClubRolesByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
  pagination: paginationSchema.optional(),
})

export type GetClubRolesByClubIdCommandInput = z.infer<typeof GetClubRolesByClubIdCommandSchema>

export const _getClubRolesByClubId = async (
  input: GetClubRolesByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = GetClubRolesByClubIdCommandSchema.parse(input)

  // fetch roles
  const roles = await db.query.clubRole.findMany({
    with: {
      members: {
        columns: {
          memberId: true,
        },
      },
    },
    where: (role, { eq }) => eq(role.clubId, data.clubId),
    orderBy: (role, { asc }) => [asc(role.name)],
  })

  return roles.map(({ members, ...role }) => ({
    ...role,
    memberCount: members.length,
  }))
}, tx)

export const getClubRolesByClubId = async (
  input: GetClubRolesByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubRolesByClubId(input, context, db)
}, tx)
