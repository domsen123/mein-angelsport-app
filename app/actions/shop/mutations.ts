import { useShopClient } from './api'
import { SHOP_QUERY_KEYS } from './queries'

export function useReservePermitsMutation() {
  const queryCache = useQueryCache()
  const client = useShopClient()

  return useMutation({
    mutation: (params: {
      clubId: string
      memberId: string
      permits: { optionPeriodId: string }[]
    }) => client.reservePermits(params.clubId, {
      memberId: params.memberId,
      permits: params.permits,
    }),
    onSuccess(_data, variables) {
      // Invalidate available permits as availability has changed
      queryCache.invalidateQueries({ key: SHOP_QUERY_KEYS.availablePermits(variables.clubId) })
    },
  })
}

export function useCreateOrderMutation() {
  const queryCache = useQueryCache()
  const client = useShopClient()

  return useMutation({
    mutation: (params: {
      clubId: string
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
    }) => client.createOrder(params.clubId, {
      memberId: params.memberId,
      permits: params.permits,
      workDutyFee: params.workDutyFee,
      shippingAddress: params.shippingAddress,
    }),
    onSuccess(_data, variables) {
      // Invalidate available permits as availability has changed
      queryCache.invalidateQueries({ key: SHOP_QUERY_KEYS.availablePermits(variables.clubId) })
    },
  })
}
