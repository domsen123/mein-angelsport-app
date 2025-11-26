import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubShopItem } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const DeleteShopItemCommandSchema = z.object({
  clubId: ulidSchema,
  itemId: ulidSchema,
})

export type DeleteShopItemCommand = z.infer<typeof DeleteShopItemCommandSchema>

export const _deleteShopItem = async (
  input: DeleteShopItemCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = DeleteShopItemCommandSchema.parse(input)

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

  await db
    .delete(clubShopItem)
    .where(eq(clubShopItem.id, data.itemId))

  return { success: true }
}, tx)

export const deleteShopItem = async (
  input: DeleteShopItemCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _deleteShopItem(input, context, db)
}, tx)

export type DeleteShopItemResponse = Awaited<ReturnType<typeof _deleteShopItem>>
