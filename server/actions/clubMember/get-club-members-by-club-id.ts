import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { paginateQuery } from '~~/server/database/pagination'
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
  const data = GetClubMembersByClubIdCommandSchema.parse(input)
  const { clubId, pagination } = data

  const result = await paginateQuery(db, clubMember, 'clubMember', pagination, {
    searchableColumns: [clubMember.firstName, clubMember.lastName, clubMember.email],
    sortableColumns: {
      firstName: clubMember.firstName,
      lastName: clubMember.lastName,
      email: clubMember.email,
      createdAt: clubMember.createdAt,
    },
    baseFilter: eq(clubMember.clubId, clubId),
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
        columns: { memberId: true, roleId: true },
        with: {
          role: {
            columns: { id: true, name: true, isClubAdmin: true },
          },
        },
      },
    },
  })

  // // Flatten user data into member
  // const items = result.items.map((member) => {
  //   if (member.user) {
  //     Object.assign(member, member.user)
  //     Reflect.deleteProperty(member, 'user')
  //   }
  //   return member
  // })

  return result
}, tx)

export const getClubMembersByClubId = async (
  input: GetClubMembersByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubMembersByClubId(input, context, db)
}, tx)

// Response types for frontend usage
export type GetClubMembersByClubIdResponse = Awaited<ReturnType<typeof _getClubMembersByClubId>>
export type ClubMemberItem = GetClubMembersByClubIdResponse['items'][number]
