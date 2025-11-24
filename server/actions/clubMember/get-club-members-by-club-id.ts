import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetClubMembersByClubIdCommandSchema = z.object({
  clubId: ulidSchema,
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
      roles: {
        with: {
          role: true,
        },
      },
    },
    where: (member, { eq }) => eq(member.clubId, data.clubId),
    orderBy: (member, { asc }) => [asc(member.createdAt)],
  })

  return members
}, tx)

export const getClubMembersByClubId = async (
  input: GetClubMembersByClubIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubMembersByClubId(input, context, db)
}, tx)
