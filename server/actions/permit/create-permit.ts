import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permit } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const CreatePermitCommandSchema = z.object({
  clubId: ulidSchema,
  name: z.string().min(1).max(100),
})

export type CreatePermitCommand = z.infer<typeof CreatePermitCommandSchema>

export const _createPermit = async (
  input: CreatePermitCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = CreatePermitCommandSchema.parse(input)

  // preparation
  const now = new Date()
  const permitId = ulid()

  // execution
  const [createdPermit] = await db
    .insert(permit)
    .values({
      id: permitId,
      clubId: data.clubId,
      name: data.name,

      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
    })
    .returning()

  return createdPermit
}, tx)

export const createPermit = async (
  input: CreatePermitCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return await _createPermit(input, context, db)
}, tx)
