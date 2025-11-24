import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { buildSearchFilter, doDatabaseOperation } from '~~/server/database/helper'
import { clubMember } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetClubMembersByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
  pagination: paginationSchema,
})

export type GetClubMembersByClubIdCommandInput = z.infer<typeof GetClubMembersByClubIdCommandSchema>

export const _getClubMembersByClubId = async (
  input: GetClubMembersByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = GetClubMembersByClubIdCommandSchema.parse(input)
  const { clubId, pagination } = data

  // Build filters
  const searchFilter = buildSearchFilter(pagination.searchTerm, [
    clubMember.firstName,
    clubMember.lastName,
    clubMember.email,
  ])

  const baseFilter = and(eq(clubMember.clubId, clubId), searchFilter)

  // Fetch members
  const members = await db.query.clubMember.findMany({
    where: baseFilter,
    orderBy: (member, { asc }) => [asc(member.createdAt)],
    offset: pagination.pageSize * (pagination.page - 1),
    limit: pagination.pageSize,
    with: {
      user: {
        columns: {
          image: true,
          firstName: true,
          lastName: true,
          street: true,
          postalCode: true,
          city: true,
          country: true,
          email: true,
        },
      },
      roles: {
        columns: {
          memberId: true,
          roleId: true,
        },
        with: {
          role: {
            columns: {
              id: true,
              name: true,
              isClubAdmin: true,
            },
          },
        },
      },
    },
  })

  // Count total
  const totalItems = await db.$count(clubMember, baseFilter)

  const items = members.map((member) => {
    if (member.user) {
      Object.assign(member, member.user)
      Reflect.deleteProperty(member, 'user')
    }
    return member
  })

  return {
    meta: {
      totalItems,
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
    items,
  }
}, tx)

export const getClubMembersByClubId = async (
  input: GetClubMembersByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubMembersByClubId(input, context, db)
}, tx)
