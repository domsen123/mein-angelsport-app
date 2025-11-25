import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubMember } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetClubMemberByIdCommandSchema = z.object({
  clubId: ulidSchema,
  memberId: ulidSchema,
})

export type GetClubMemberByIdCommandInput = z.infer<typeof GetClubMemberByIdCommandSchema>

export const _getClubMemberById = async (
  input: GetClubMemberByIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetClubMemberByIdCommandSchema.parse(input)
  const { clubId, memberId } = data

  const member = await db.query.clubMember.findFirst({
    where: and(
      eq(clubMember.id, memberId),
      eq(clubMember.clubId, clubId),
    ),
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

  if (!member) {
    throw createError({
      statusCode: 404,
      message: 'Member not found',
    })
  }

  return member
}, tx)

export const getClubMemberById = async (
  input: GetClubMemberByIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubMemberById(input, context, db)
}, tx)

// Response types for frontend usage
export type GetClubMemberByIdResponse = Awaited<ReturnType<typeof _getClubMemberById>>
