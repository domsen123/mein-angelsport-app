import type { MaybeRef } from 'vue'
import { useUpdatePermitInstanceMutation } from '~/actions/permits/mutations'
import { usePermitInstanceByIdQuery } from '~/actions/permits/queries'

export interface PermitInstanceFormState {
  status: 'available' | 'reserved' | 'sold' | 'cancelled'
  ownerMemberId: string | null
  ownerName: string | null
  ownerEmail: string | null
  ownerPhone: string | null
  paymentReference: string | null
  paidCents: string | null
  notes: string | null
}

const defaultState = (): PermitInstanceFormState => ({
  status: 'available',
  ownerMemberId: null,
  ownerName: null,
  ownerEmail: null,
  ownerPhone: null,
  paymentReference: null,
  paidCents: null,
  notes: null,
})

export interface UsePermitInstanceFormParams {
  clubId: MaybeRef<string | undefined>
  permitId: MaybeRef<string | undefined>
  optionId: MaybeRef<string | undefined>
  periodId: MaybeRef<string | undefined>
}

export function usePermitInstanceForm(params: UsePermitInstanceFormParams) {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  // Get values as refs
  const clubIdRef = computed(() => toValue(params.clubId))
  const permitIdRef = computed(() => toValue(params.permitId))
  const optionIdRef = computed(() => toValue(params.optionId))
  const periodIdRef = computed(() => toValue(params.periodId))

  // Mode detection - only edit mode for instances (no create)
  const instanceId = computed(() => route.query.instanceId as string | undefined)
  const isOpen = computed(() => !!instanceId.value)

  // Form state
  const state = reactive<PermitInstanceFormState>(defaultState())

  // Fetch instance data
  const { data: instanceData, isLoading: isInstanceLoading } = useQuery(
    usePermitInstanceByIdQuery,
    () => ({
      clubId: clubIdRef.value!,
      permitId: permitIdRef.value!,
      optionId: optionIdRef.value!,
      periodId: periodIdRef.value!,
      instanceId: instanceId.value!,
    }),
  )

  // Watch instance data to populate form
  watch(instanceData, (instance) => {
    if (instance) {
      state.status = instance.status as PermitInstanceFormState['status']
      state.ownerMemberId = instance.ownerMemberId || null
      state.ownerName = instance.ownerName || null
      state.ownerEmail = instance.ownerEmail || null
      state.ownerPhone = instance.ownerPhone || null
      state.paymentReference = instance.paymentReference || null
      state.paidCents = instance.paidCents || null
      state.notes = instance.notes || null
    }
  }, { immediate: true })

  // Reset form when closing
  watch(isOpen, (open) => {
    if (!open) {
      Object.assign(state, defaultState())
    }
  })

  // Mutation
  const updateMutation = useUpdatePermitInstanceMutation()

  const isLoading = computed(() =>
    isInstanceLoading.value || updateMutation.isLoading.value,
  )

  // Submit handler
  async function submit() {
    const clubId = clubIdRef.value
    const permitId = permitIdRef.value
    const optionId = optionIdRef.value
    const periodId = periodIdRef.value
    const currentInstanceId = instanceId.value

    if (!clubId || !permitId || !optionId || !periodId || !currentInstanceId) {
      return
    }

    try {
      await updateMutation.mutateAsync({
        clubId,
        permitId,
        optionId,
        periodId,
        instanceId: currentInstanceId,
        ...state,
      })
      toast.add({
        title: 'Karte aktualisiert',
        description: 'Die Erlaubniskarte wurde erfolgreich aktualisiert.',
        color: 'success',
      })
      close()
    }
    catch (error: any) {
      toast.add({
        title: 'Fehler',
        description: error?.message || 'Ein Fehler ist aufgetreten.',
        color: 'error',
      })
    }
  }

  // Close handler - remove query param
  function close() {
    const query = { ...route.query }
    delete query.instanceId
    router.replace({ query })
  }

  // Open handler
  function openEdit(id: string) {
    router.push({ query: { ...route.query, instanceId: id } })
  }

  return {
    // Mode
    instanceId,
    isOpen,
    // State
    state,
    instanceData,
    // Loading
    isLoading,
    isInstanceLoading,
    // Actions
    submit,
    close,
    openEdit,
  }
}
