import type { CreateOrderResponse } from '~~/server/actions/shop/create-order'
import type { GetAvailablePermitsResponse } from '~~/server/actions/shop/get-available-permits'
import type { GetMemberDiscountsResponse } from '~~/server/actions/shop/get-member-discounts'
import type { GetSelectableMembersResponse } from '~~/server/actions/shop/get-selectable-members'
import type { GetWorkDutyStatusResponse } from '~~/server/actions/shop/get-work-duty-status'
import type { ReservePermitsResponse } from '~~/server/actions/shop/reserve-permits'

export const useShopClient = () => {
  const { $api } = useNuxtApp()

  const getSelectableMembers = (clubId: string) =>
    $api<GetSelectableMembersResponse>(`/api/club/${clubId}/shop/members`, {
      method: 'GET',
    })

  const getAvailablePermits = (clubId: string) =>
    $api<GetAvailablePermitsResponse>(`/api/club/${clubId}/shop/permits`, {
      method: 'GET',
    })

  const getWorkDutyStatus = (clubId: string, memberId: string) =>
    $api<GetWorkDutyStatusResponse>(`/api/club/${clubId}/shop/work-duties`, {
      method: 'GET',
      query: { memberId },
    })

  const getMemberDiscounts = (clubId: string, memberId: string) =>
    $api<GetMemberDiscountsResponse>(`/api/club/${clubId}/shop/discounts`, {
      method: 'GET',
      query: { memberId },
    })

  const reservePermits = (clubId: string, body: {
    memberId: string
    permits: { optionPeriodId: string }[]
  }) =>
    $api<ReservePermitsResponse>(`/api/club/${clubId}/shop/reserve`, {
      method: 'POST',
      body,
    })

  const createOrder = (clubId: string, body: {
    memberId: string
    permits: {
      permitInstanceId: string
      permitName: string
      optionName: string
      optionId: string
      originalPriceCents: number
      discountPercent: number
    }[]
    workDutyFee?: {
      missing: number
      feePerDutyCents: number
      totalFeeCents: number
    }
    shippingAddress: {
      street: string
      postalCode: string
      city: string
      country: string
    }
  }) =>
    $api<CreateOrderResponse>(`/api/club/${clubId}/shop/order`, {
      method: 'POST',
      body,
    })

  return {
    getSelectableMembers,
    getAvailablePermits,
    getWorkDutyStatus,
    getMemberDiscounts,
    reservePermits,
    createOrder,
  }
}
