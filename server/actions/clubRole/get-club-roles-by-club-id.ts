import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { paginateQuery } from '~~/server/database/pagination'
import { clubRole } from '~~/server/database/schema'
import { isExecutorClubAdmin } from './checks/is-executor-club-admin'

export const GetClubRolesByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
  pagination: paginationSchema,
})

export type GetClubRolesByClubIdCommandInput = z.infer<typeof GetClubRolesByClubIdCommandSchema>

export const _getClubRolesByClubId = async (
  input: GetClubRolesByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetClubRolesByClubIdCommandSchema.parse(input)
  const { clubId, pagination } = data

  const result = await paginateQuery(db, clubRole, 'clubRole', pagination, {
    searchableColumns: [clubRole.name],
    sortableColumns: {
      name: clubRole.name,
      createdAt: clubRole.createdAt,
      isClubAdmin: clubRole.isClubAdmin,
    },
    baseFilter: eq(clubRole.clubId, clubId),
    with: {
      members: {
        columns: { memberId: true },
      },
    },
  })

  // Transform: add memberCount from members relation
  const items = result.items.map(({ members, ...role }) => ({
    ...role,
    memberCount: members.length,
  }))

  return { ...result, items }
}, tx)

export const getClubRolesByClubId = async (
  input: GetClubRolesByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubRolesByClubId(input, context, db)
}, tx)
