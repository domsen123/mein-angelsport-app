import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubRole } from '~~/server/database/schema'
import { isExecutorClubAdmin } from './checks/is-executor-club-admin'

export const CreateClubRoleCommandSchema = z.object({
  clubId: ulidSchema,
  name: z
    .string()
    .min(1, 'Vereinsrollenname kann nicht leer sein')
    .max(40, 'Vereinsrollenname darf 40 Zeichen nicht überschreiten')
    .describe('Der vollständige Name der Vereinsrolle')
    .trim(),
  description: z
    .string()
    .max(200, 'Die Beschreibung der Vereinsrolle darf 200 Zeichen nicht überschreiten')
    .describe('Eine optionale Beschreibung der Vereinsrolle')
    .trim()
    .optional(),
  isClubAdmin: z.boolean().optional().default(false),
  isExemptFromWorkDuties: z.boolean().optional().default(false),
})

export type CreateClubRoleCommand = z.infer<typeof CreateClubRoleCommandSchema>

export const _createClubRole = async (
  input: CreateClubRoleCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = CreateClubRoleCommandSchema.parse(input)

  // preparation
  const clubRoleId = ulid()
  const now = new Date()

  // execution
  const [createClubRole] = await db
    .insert(clubRole)
    .values({
      id: clubRoleId,
      clubId: data.clubId,
      name: data.name,
      description: data.description,
      isClubAdmin: data.isClubAdmin,
      isExemptFromWorkDuties: data.isExemptFromWorkDuties,

      createdBy: context.userId,
      updatedBy: context.userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return createClubRole
}, tx)

export const createClubRole = async (
  input: CreateClubRoleCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _createClubRole(input, context, db)
}, tx)
