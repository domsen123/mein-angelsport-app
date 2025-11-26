import type { CreateShopItemCommand, CreateShopItemResponse } from '~~/server/actions/shop-admin/create-shop-item'
import type { DeleteShopItemCommand, DeleteShopItemResponse } from '~~/server/actions/shop-admin/delete-shop-item'
import type { GetOrderByIdCommand, GetOrderByIdResponse } from '~~/server/actions/shop-admin/get-order-by-id'
import type { GetOrdersCommand, GetOrdersResponse } from '~~/server/actions/shop-admin/get-orders'
import type { GetShopItemByIdCommand, GetShopItemByIdResponse } from '~~/server/actions/shop-admin/get-shop-item-by-id'
import type { GetShopItemsCommand, GetShopItemsResponse } from '~~/server/actions/shop-admin/get-shop-items'
import type { UpdateOrderCommand, UpdateOrderResponse } from '~~/server/actions/shop-admin/update-order'
import type { UpdateShopItemCommand, UpdateShopItemResponse } from '~~/server/actions/shop-admin/update-shop-item'

export const useShopAdminClient = () => {
  const { $api } = useNuxtApp()

  // Shop Items
  const getShopItems = ({ clubId, pagination }: GetShopItemsCommand) =>
    $api<GetShopItemsResponse>(`/api/club/${clubId}/_admin/shop/items`, {
      method: 'GET',
      query: { ...pagination },
    })

  const getShopItemById = ({ clubId, itemId }: GetShopItemByIdCommand) =>
    $api<GetShopItemByIdResponse>(`/api/club/${clubId}/_admin/shop/items/${itemId}`, {
      method: 'GET',
    })

  const createShopItem = ({ clubId, ...body }: CreateShopItemCommand) =>
    $api<CreateShopItemResponse>(`/api/club/${clubId}/_admin/shop/items`, {
      method: 'POST',
      body,
    })

  const updateShopItem = ({ clubId, itemId, ...body }: UpdateShopItemCommand) =>
    $api<UpdateShopItemResponse>(`/api/club/${clubId}/_admin/shop/items/${itemId}`, {
      method: 'PUT',
      body,
    })

  const deleteShopItem = ({ clubId, itemId }: DeleteShopItemCommand) =>
    $api<DeleteShopItemResponse>(`/api/club/${clubId}/_admin/shop/items/${itemId}`, {
      method: 'DELETE',
    })

  // Orders
  const getOrders = ({ clubId, pagination, status, year }: GetOrdersCommand) =>
    $api<GetOrdersResponse>(`/api/club/${clubId}/_admin/shop/orders`, {
      method: 'GET',
      query: { ...pagination, status, year },
    })

  const getOrderById = ({ clubId, orderId }: GetOrderByIdCommand) =>
    $api<GetOrderByIdResponse>(`/api/club/${clubId}/_admin/shop/orders/${orderId}`, {
      method: 'GET',
    })

  const updateOrder = ({ clubId, orderId, ...body }: UpdateOrderCommand) =>
    $api<UpdateOrderResponse>(`/api/club/${clubId}/_admin/shop/orders/${orderId}`, {
      method: 'PATCH',
      body,
    })

  return {
    getShopItems,
    getShopItemById,
    createShopItem,
    updateShopItem,
    deleteShopItem,
    getOrders,
    getOrderById,
    updateOrder,
  }
}
