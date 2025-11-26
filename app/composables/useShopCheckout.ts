import { useSessionStorage } from '@vueuse/core'

export interface SelectedPermit {
  permitId: string
  permitName: string
  optionId: string
  optionName: string
  periodId: string
  permitInstanceId: string
  priceCents: number
}

export interface WorkDutyInfo {
  required: number
  attended: number
  missing: number
  feePerDutyCents: number
  totalFeeCents: number
  isExempt: boolean
}

export interface AppliedDiscount {
  permitOptionId: string
  discountPercent: number
  roleId: string
  roleName: string
}

export interface ShippingAddress {
  street: string
  postalCode: string
  city: string
  country: string
}

export interface CheckoutState {
  memberId: string | null
  memberName: string | null
  selectedPermits: SelectedPermit[]
  workDutyInfo: WorkDutyInfo | null
  discounts: AppliedDiscount[]
  shippingAddress: ShippingAddress | null
  reservationExpiresAt: string | null // ISO string for storage
}

const defaultState: CheckoutState = {
  memberId: null,
  memberName: null,
  selectedPermits: [],
  workDutyInfo: null,
  discounts: [],
  shippingAddress: null,
  reservationExpiresAt: null,
}

export const useShopCheckoutStore = defineStore('shop-checkout', () => {
  // Persist to sessionStorage using @vueuse/core
  const state = useSessionStorage<CheckoutState>('shop-checkout', { ...defaultState })

  // Computed
  const isReservationValid = computed(() => {
    if (!state.value.reservationExpiresAt)
      return false
    return new Date(state.value.reservationExpiresAt) > new Date()
  })

  const reservationExpiresAt = computed(() =>
    state.value.reservationExpiresAt ? new Date(state.value.reservationExpiresAt) : null,
  )

  const hasSelectedPermits = computed(() => state.value.selectedPermits.length > 0)

  const subtotalCents = computed(() =>
    state.value.selectedPermits.reduce((sum, p) => sum + p.priceCents, 0),
  )

  const totalDiscountCents = computed(() => {
    let total = 0
    for (const permit of state.value.selectedPermits) {
      const discount = state.value.discounts.find(d => d.permitOptionId === permit.optionId)
      if (discount) {
        total += Math.floor(permit.priceCents * discount.discountPercent / 100)
      }
    }
    return total
  })

  const workDutyFeeCents = computed(() => state.value.workDutyInfo?.totalFeeCents ?? 0)

  const totalCents = computed(() => subtotalCents.value - totalDiscountCents.value + workDutyFeeCents.value)

  // Setters
  const setMember = (memberId: string, memberName: string) => {
    state.value.memberId = memberId
    state.value.memberName = memberName
  }

  const setSelectedPermits = (permits: SelectedPermit[]) => {
    state.value.selectedPermits = permits
  }

  const setWorkDutyInfo = (info: WorkDutyInfo) => {
    state.value.workDutyInfo = info
  }

  const setDiscounts = (discounts: AppliedDiscount[]) => {
    state.value.discounts = discounts
  }

  const setShippingAddress = (address: ShippingAddress) => {
    state.value.shippingAddress = address
  }

  const setReservationExpiresAt = (date: Date) => {
    state.value.reservationExpiresAt = date.toISOString()
  }

  const reset = () => {
    state.value = { ...defaultState }
  }

  // Get discount for a specific permit option
  const getDiscountForOption = (optionId: string) =>
    state.value.discounts.find(d => d.permitOptionId === optionId)

  // Calculate final price for a permit after discount
  const getFinalPriceForPermit = (permit: SelectedPermit) => {
    const discount = getDiscountForOption(permit.optionId)
    if (!discount)
      return permit.priceCents
    return permit.priceCents - Math.floor(permit.priceCents * discount.discountPercent / 100)
  }

  return {
    // State (readonly)
    state: readonly(state),

    // Computed
    isReservationValid,
    reservationExpiresAt,
    hasSelectedPermits,
    subtotalCents,
    totalDiscountCents,
    workDutyFeeCents,
    totalCents,

    // Setters
    setMember,
    setSelectedPermits,
    setWorkDutyInfo,
    setDiscounts,
    setShippingAddress,
    setReservationExpiresAt,
    reset,

    // Helpers
    getDiscountForOption,
    getFinalPriceForPermit,
  }
})
