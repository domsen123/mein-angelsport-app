import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import z from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { permitOption } from '~~/server/database/schema'

export const CreatePermitOptionCommandSchema = z.object({
  permitId: ulidSchema,
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
})

export type CreatePermitOptionCommand = z.infer<typeof CreatePermitOptionCommandSchema>

export const _createPermitOption = async (
  input: CreatePermitOptionCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = CreatePermitOptionCommandSchema.parse(input)

  // preparation
  const now = new Date()
  const id = ulid()

  // execution
  const [createdPermitOption] = await db
    .insert(permitOption)
    .values({
      id,
      permitId: data.permitId,
      name: data.name || null,
      description: data.description || null,
      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
    })
    .returning()

  return createdPermitOption
}, tx)

export const createPermitOption = async (
  input: CreatePermitOptionCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  return _createPermitOption(input, context, db)
}, tx)
