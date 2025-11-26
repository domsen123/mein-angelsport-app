import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { clubShopItem } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetShopItemByIdCommandSchema = z.object({
  clubId: ulidSchema,
  itemId: ulidSchema,
})

export type GetShopItemByIdCommand = z.infer<typeof GetShopItemByIdCommandSchema>

export const _getShopItemById = async (
  input: GetShopItemByIdCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetShopItemByIdCommandSchema.parse(input)

  const item = await db.query.clubShopItem.findFirst({
    where: and(
      eq(clubShopItem.clubId, data.clubId),
      eq(clubShopItem.id, data.itemId),
    ),
  })

  if (!item) {
    throw createError({
      statusCode: 404,
      message: 'Shop-Artikel nicht gefunden',
    })
  }

  return item
}, tx)

export const getShopItemById = async (
  input: GetShopItemByIdCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getShopItemById(input, context, db)
}, tx)

export type GetShopItemByIdResponse = Awaited<ReturnType<typeof _getShopItemById>>
