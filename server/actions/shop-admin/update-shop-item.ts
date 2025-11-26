import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubShopItem } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const UpdateShopItemCommandSchema = z.object({
  clubId: ulidSchema,
  itemId: ulidSchema,
  name: z.string().min(1, 'Name ist erforderlich').max(255),
  description: z.string().max(1000).nullish().transform(v => v || null),
  priceCents: z.number().int().min(0),
  isStandalone: z.boolean(),
  autoAddOnPermitPurchase: z.boolean(),
  isActive: z.boolean(),
})

export type UpdateShopItemCommand = z.infer<typeof UpdateShopItemCommandSchema>

export const _updateShopItem = async (
  input: UpdateShopItemCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = UpdateShopItemCommandSchema.parse(input)

  // Verify item exists and belongs to club
  const existing = await db.query.clubShopItem.findFirst({
    where: and(
      eq(clubShopItem.clubId, data.clubId),
      eq(clubShopItem.id, data.itemId),
    ),
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Shop-Artikel nicht gefunden',
    })
  }

  const [updatedItem] = await db
    .update(clubShopItem)
    .set({
      name: data.name,
      description: data.description,
      priceCents: data.priceCents,
      isStandalone: data.isStandalone,
      autoAddOnPermitPurchase: data.autoAddOnPermitPurchase,
      isActive: data.isActive,
      updatedAt: new Date(),
      updatedBy: context.userId,
    })
    .where(eq(clubShopItem.id, data.itemId))
    .returning()

  return updatedItem
}, tx)

export const updateShopItem = async (
  input: UpdateShopItemCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _updateShopItem(input, context, db)
}, tx)

export type UpdateShopItemResponse = Awaited<ReturnType<typeof _updateShopItem>>
