import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import { z } from 'zod'
import { doDatabaseOperation, ensureUniqueSlug } from '~~/server/database/helper'
import { water } from '~~/server/database/schema'

export const CreateWaterSchema = z.object({
  type: z.enum(['lotic', 'lentic']),
  name: z.string().min(1, 'Gewässername ist erforderlich').max(100),
  postCode: z.string().min(1, 'Postleitzahl ist erforderlich').max(10),
})

export type CreateWaterCommand = z.infer<typeof CreateWaterSchema>

export const _createWater = async (
  input: CreateWaterCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  // validation
  const data = CreateWaterSchema.parse(input)

  // preparation
  const waterId = ulid()
  const now = new Date()

  const preparedSlug = data.type === 'lentic' ? `${data.postCode}-${data.name}` : data.name
  const generatedSlug = generateSlug(preparedSlug)
  const slug = await ensureUniqueSlug(generatedSlug, water, db)

  // Create the water record
  const [createdWater] = await db
    .insert(water)
    .values({
      id: waterId,
      type: data.type,
      name: data.name,
      slug,
      postCode: data.postCode,
      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
    })
    .returning()

  return createdWater
}, tx)

export const createWater = async (
  input: CreateWaterCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => _createWater(input, context, tx)
