import type { CreateShopItemCommand } from '~~/server/actions/shop-admin/create-shop-item'
import type { DeleteShopItemCommand } from '~~/server/actions/shop-admin/delete-shop-item'
import type { UpdateOrderCommand } from '~~/server/actions/shop-admin/update-order'
import type { UpdateShopItemCommand } from '~~/server/actions/shop-admin/update-shop-item'
import { useShopAdminClient } from './api'
import { SHOP_ADMIN_QUERY_KEYS } from './queries'

// Shop Items Mutations
export function useCreateShopItemMutation() {
  const queryCache = useQueryCache()
  const client = useShopAdminClient()

  return useMutation({
    mutation: (input: CreateShopItemCommand) => client.createShopItem(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: SHOP_ADMIN_QUERY_KEYS.items(variables.clubId) })
    },
  })
}

export function useUpdateShopItemMutation() {
  const queryCache = useQueryCache()
  const client = useShopAdminClient()

  return useMutation({
    mutation: (input: UpdateShopItemCommand) => client.updateShopItem(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: SHOP_ADMIN_QUERY_KEYS.items(variables.clubId) })
      queryCache.invalidateQueries({
        key: SHOP_ADMIN_QUERY_KEYS.itemById({ clubId: variables.clubId, itemId: variables.itemId }),
      })
    },
  })
}

export function useDeleteShopItemMutation() {
  const queryCache = useQueryCache()
  const client = useShopAdminClient()

  return useMutation({
    mutation: (input: DeleteShopItemCommand) => client.deleteShopItem(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: SHOP_ADMIN_QUERY_KEYS.items(variables.clubId) })
    },
  })
}

// Orders Mutations
export function useUpdateOrderMutation() {
  const queryCache = useQueryCache()
  const client = useShopAdminClient()

  return useMutation({
    mutation: (input: UpdateOrderCommand) => client.updateOrder(input),
    onSuccess(_data, variables) {
      queryCache.invalidateQueries({ key: SHOP_ADMIN_QUERY_KEYS.orders(variables.clubId) })
      queryCache.invalidateQueries({
        key: SHOP_ADMIN_QUERY_KEYS.orderById({ clubId: variables.clubId, orderId: variables.orderId }),
      })
    },
  })
}
