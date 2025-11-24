import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { buildSearchFilter, doDatabaseOperation } from '~~/server/database/helper'
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
  // validation
  const data = GetClubRolesByClubIdCommandSchema.parse(input)
  const { clubId, pagination } = data

  // build filters
  const searchFilter = buildSearchFilter(pagination.searchTerm, [
    clubRole.name,
  ])

  const baseFilter = and(eq(clubRole.clubId, clubId), searchFilter)

  // fetch roles
  const roles = await db.query.clubRole.findMany({
    where: baseFilter,
    orderBy: (member, { asc }) => [asc(member.createdAt)],
    offset: pagination.pageSize * (pagination.page - 1),
    limit: pagination.pageSize,
    with: {
      members: {
        columns: {
          memberId: true,
        },
      },
    },
  })

  // Count total
  const totalItems = await db.$count(clubRole, baseFilter)

  const items = roles.map(({ members, ...role }) => ({
    ...role,
    memberCount: members.length,
  }))

  return {
    meta: {
      totalItems,
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
    items,
  }
}, tx)

export const getClubRolesByClubId = async (
  input: GetClubRolesByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubRolesByClubId(input, context, db)
}, tx)
