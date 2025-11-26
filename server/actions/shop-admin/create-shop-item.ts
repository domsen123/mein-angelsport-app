import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { ulid } from 'ulid'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubShopItem } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const CreateShopItemCommandSchema = z.object({
  clubId: ulidSchema,
  name: z.string().min(1, 'Name ist erforderlich').max(255),
  description: z.string().max(1000).nullish().transform(v => v || null),
  priceCents: z.number().int().min(0).default(0),
  isStandalone: z.boolean().default(false),
  autoAddOnPermitPurchase: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type CreateShopItemCommand = z.infer<typeof CreateShopItemCommandSchema>

export const _createShopItem = async (
  input: CreateShopItemCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = CreateShopItemCommandSchema.parse(input)

  const itemId = ulid()
  const now = new Date()

  const [createdItem] = await db
    .insert(clubShopItem)
    .values({
      id: itemId,
      clubId: data.clubId,
      name: data.name,
      description: data.description,
      priceCents: data.priceCents,
      isStandalone: data.isStandalone,
      autoAddOnPermitPurchase: data.autoAddOnPermitPurchase,
      isActive: data.isActive,
      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
    })
    .returning()

  return createdItem
}, tx)

export const createShopItem = async (
  input: CreateShopItemCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _createShopItem(input, context, db)
}, tx)

export type CreateShopItemResponse = Awaited<ReturnType<typeof _createShopItem>>
