import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubRole } from '~~/server/database/schema'
import { isExecutorClubAdmin } from './checks/is-executor-club-admin'

export const UpdateClubRoleCommandSchema = z.object({
  clubId: ulidSchema,
  roleId: ulidSchema,
  name: z
    .string()
    .min(1, 'Vereinsrollenname kann nicht leer sein')
    .max(40, 'Vereinsrollenname darf 40 Zeichen nicht überschreiten')
    .trim(),
  description: z
    .string()
    .max(200, 'Die Beschreibung der Vereinsrolle darf 200 Zeichen nicht überschreiten')
    .trim()
    .optional()
    .nullable(),
  isClubAdmin: z.boolean().optional().default(false),
  isExemptFromWorkDuties: z.boolean().optional().default(false),
})

export type UpdateClubRoleCommand = z.infer<typeof UpdateClubRoleCommandSchema>

export const _updateClubRole = async (
  input: UpdateClubRoleCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdateClubRoleCommandSchema.parse(input)

  const [updatedRole] = await db
    .update(clubRole)
    .set({
      name: data.name,
      description: data.description || null,
      isClubAdmin: data.isClubAdmin,
      isExemptFromWorkDuties: data.isExemptFromWorkDuties,
      updatedBy: context.userId,
      updatedAt: new Date(),
    })
    .where(and(
      eq(clubRole.id, data.roleId),
      eq(clubRole.clubId, data.clubId),
    ))
    .returning()

  if (!updatedRole) {
    throw createError({
      statusCode: 404,
      message: 'Role not found',
    })
  }

  return updatedRole
}, tx)

export const updateClubRole = async (
  input: UpdateClubRoleCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _updateClubRole(input, context, db)
}, tx)
