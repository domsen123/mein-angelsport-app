import type { GetOrderByIdCommand } from '~~/server/actions/shop-admin/get-order-by-id'
import type { GetOrdersCommand } from '~~/server/actions/shop-admin/get-orders'
import type { GetShopItemByIdCommand } from '~~/server/actions/shop-admin/get-shop-item-by-id'
import type { GetShopItemsCommand } from '~~/server/actions/shop-admin/get-shop-items'
import { useShopAdminClient } from './api'

export const SHOP_ADMIN_QUERY_KEYS = {
  root: ['shop-admin'] as const,
  // Shop Items
  items: (clubId: string) => [...SHOP_ADMIN_QUERY_KEYS.root, 'items', clubId] as const,
  itemsPaginated: (args: GetShopItemsCommand) => [
    ...SHOP_ADMIN_QUERY_KEYS.items(args.clubId),
    JSON.stringify(args.pagination),
  ] as const,
  itemById: (args: GetShopItemByIdCommand) => [
    ...SHOP_ADMIN_QUERY_KEYS.root,
    'item',
    args.clubId,
    args.itemId,
  ] as const,
  // Orders
  orders: (clubId: string) => [...SHOP_ADMIN_QUERY_KEYS.root, 'orders', clubId] as const,
  ordersPaginated: (args: GetOrdersCommand) => [
    ...SHOP_ADMIN_QUERY_KEYS.orders(args.clubId),
    JSON.stringify(args.pagination),
    args.status,
    args.year,
  ] as const,
  orderById: (args: GetOrderByIdCommand) => [
    ...SHOP_ADMIN_QUERY_KEYS.root,
    'order',
    args.clubId,
    args.orderId,
  ] as const,
}

// Shop Items Queries
export const useShopItemsQuery = ({ clubId, pagination }: GetShopItemsCommand) =>
  defineQueryOptions({
    key: SHOP_ADMIN_QUERY_KEYS.itemsPaginated({ clubId, pagination }),
    query: () => useShopAdminClient().getShopItems({ clubId, pagination }),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 5,
  })

export const useShopItemByIdQuery = ({ clubId, itemId }: GetShopItemByIdCommand) =>
  defineQueryOptions({
    key: SHOP_ADMIN_QUERY_KEYS.itemById({ clubId, itemId }),
    query: () => useShopAdminClient().getShopItemById({ clubId, itemId }),
    enabled: !!clubId && !!itemId && itemId !== 'new',
    staleTime: 1000 * 60 * 5,
  })

// Orders Queries
export const useOrdersQuery = defineQueryOptions(
  ({ clubId, pagination, status, year }: GetOrdersCommand) => ({
    key: [...SHOP_ADMIN_QUERY_KEYS.orders(clubId), JSON.stringify(pagination), status ?? 'all', year ?? 'all'] as const,
    query: () => useShopAdminClient().getOrders({ clubId, pagination, status, year }),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 2,
  }),
)

export const useOrderByIdQuery = defineQueryOptions(
  ({ clubId, orderId }: GetOrderByIdCommand) => ({
    key: SHOP_ADMIN_QUERY_KEYS.orderById({ clubId, orderId }),
    query: () => useShopAdminClient().getOrderById({ clubId, orderId }),
    enabled: !!clubId && !!orderId,
    staleTime: 1000 * 60 * 2,
  }),
)
