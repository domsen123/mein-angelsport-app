import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubRole } from '~~/server/database/schema'
import { isExecutorClubAdmin } from './checks/is-executor-club-admin'

export const GetClubRoleByIdCommandSchema = z.object({
  clubId: ulidSchema,
  roleId: ulidSchema,
})

export type GetClubRoleByIdCommandInput = z.infer<typeof GetClubRoleByIdCommandSchema>

export const _getClubRoleById = async (
  input: GetClubRoleByIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetClubRoleByIdCommandSchema.parse(input)
  const { clubId, roleId } = data

  const role = await db.query.clubRole.findFirst({
    where: and(
      eq(clubRole.id, roleId),
      eq(clubRole.clubId, clubId),
    ),
  })

  if (!role) {
    throw createError({
      statusCode: 404,
      message: 'Role not found',
    })
  }

  return role
}, tx)

export const getClubRoleById = async (
  input: GetClubRoleByIdCommandInput,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getClubRoleById(input, context, db)
}, tx)

export type GetClubRoleByIdResponse = Awaited<ReturnType<typeof _getClubRoleById>>
