import type { MaybeRef } from 'vue'
import { useCreateWaterMutation, useUpdateWaterMutation } from '~/actions/waters/mutations'
import { useWaterByIdQuery } from '~/actions/waters/queries'

export interface WaterFormState {
  type: 'lotic' | 'lentic'
  name: string
  postCode: string
}

const defaultState = (): WaterFormState => ({
  type: 'lentic',
  name: '',
  postCode: '',
})

export function useWaterForm(clubId: MaybeRef<string | undefined>) {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  // Mode detection
  const waterId = computed(() => route.query.waterId as string | undefined)
  const isCreateMode = computed(() => waterId.value === 'new')
  const isEditMode = computed(() => !!waterId.value && waterId.value !== 'new')
  const isOpen = computed(() => !!waterId.value)

  // Form state
  const state = reactive<WaterFormState>(defaultState())

  // Get clubId as ref
  const clubIdRef = computed(() => toValue(clubId))

  // Fetch water data in edit mode
  const { data: waterData, isLoading: isWaterLoading } = useQuery(useWaterByIdQuery, () => ({
    clubId: clubIdRef.value!,
    waterId: waterId.value!,
  }))

  // Watch water data to populate form
  watch(waterData, (water) => {
    if (water) {
      state.type = water.type || 'lentic'
      state.name = water.name || ''
      state.postCode = water.postCode || ''
    }
  }, { immediate: true })

  // Reset form when switching to create mode
  watch(isCreateMode, (isCreate) => {
    if (isCreate) {
      Object.assign(state, defaultState())
    }
  }, { immediate: true })

  // Mutations
  const createMutation = useCreateWaterMutation()
  const updateMutation = useUpdateWaterMutation()

  const isLoading = computed(() =>
    isWaterLoading.value
    || createMutation.isLoading.value
    || updateMutation.isLoading.value,
  )

  // Submit handler
  async function submit() {
    const currentClubId = clubIdRef.value
    if (!currentClubId)
      return

    try {
      if (isCreateMode.value) {
        await createMutation.mutateAsync({
          clubId: currentClubId,
          type: state.type,
          name: state.name,
          postCode: state.postCode,
        })
        toast.add({
          title: 'Gewässer erstellt',
          description: `${state.name} wurde erfolgreich hinzugefügt.`,
          color: 'success',
        })
      }
      else if (isEditMode.value && waterId.value) {
        await updateMutation.mutateAsync({
          clubId: currentClubId,
          waterId: waterId.value,
          type: state.type,
          name: state.name,
          postCode: state.postCode,
        })
        toast.add({
          title: 'Gewässer aktualisiert',
          description: `${state.name} wurde erfolgreich aktualisiert.`,
          color: 'success',
        })
      }
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
    delete query.waterId
    router.replace({ query })
  }

  // Open handlers
  function openCreate() {
    router.push({ query: { ...route.query, waterId: 'new' } })
  }

  function openEdit(id: string) {
    router.push({ query: { ...route.query, waterId: id } })
  }

  return {
    // Mode
    waterId,
    isCreateMode,
    isEditMode,
    isOpen,
    // State
    state,
    waterData,
    // Loading
    isLoading,
    isWaterLoading,
    // Actions
    submit,
    close,
    openCreate,
    openEdit,
  }
}
