import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetClubMembersByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
  pagination: paginationSchema.optional(),
})

export type GetClubMembersByClubIdCommandInput = z.infer<typeof GetClubMembersByClubIdCommandSchema>

export const _getClubMembersByClubId = async (
  input: GetClubMembersByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = GetClubMembersByClubIdCommandSchema.parse(input)

  // fetch members
  const members = await db.query.clubMember.findMany({
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
    where: (member, { eq }) => eq(member.clubId, data.clubId),
    orderBy: (member, { asc }) => [asc(member.createdAt)],
  })

  return members.map((member) => {
    if (member.user) {
      Object.assign(member, member.user)
      Reflect.deleteProperty(member, 'user')
    }
    return member
  })
}, tx)

export const getClubMembersByClubId = async (
  input: GetClubMembersByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubMembersByClubId(input, context, db)
}, tx)
