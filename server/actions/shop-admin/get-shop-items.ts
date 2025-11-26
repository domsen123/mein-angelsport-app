import type { DatabaseClient } from '~~/server/database/client'
import type { ExecutionContext } from '~~/server/types/ExecutionContext'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { doDatabaseOperation } from '~~/server/database/helper'
import { paginateQuery } from '~~/server/database/pagination'
import { clubShopItem } from '~~/server/database/schema'
import { isExecutorClubAdmin } from '../clubRole/checks/is-executor-club-admin'

export const GetShopItemsCommandSchema = z.object({
  clubId: ulidSchema,
  pagination: paginationSchema,
})

export type GetShopItemsCommand = z.infer<typeof GetShopItemsCommandSchema>

export const _getShopItems = async (
  input: GetShopItemsCommand,
  _context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  const data = GetShopItemsCommandSchema.parse(input)
  const { clubId, pagination } = data

  return paginateQuery(db, clubShopItem, 'clubShopItem', pagination, {
    searchableColumns: [clubShopItem.name, clubShopItem.description],
    sortableColumns: {
      name: clubShopItem.name,
      priceCents: clubShopItem.priceCents,
      isActive: clubShopItem.isActive,
      createdAt: clubShopItem.createdAt,
    },
    baseFilter: eq(clubShopItem.clubId, clubId),
  })
}, tx)

export const getShopItems = async (
  input: GetShopItemsCommand,
  context: ExecutionContext,
  tx?: DatabaseClient,
) => doDatabaseOperation(async (db) => {
  await isExecutorClubAdmin(input.clubId, context, db)
  return _getShopItems(input, context, db)
}, tx)

export type GetShopItemsResponse = Awaited<ReturnType<typeof _getShopItems>>
export type ShopItemListItem = GetShopItemsResponse['items'][number]
