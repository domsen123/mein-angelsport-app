import * as z from 'zod'
import {
  useAssignWaterToPermitMutation,
  useCreatePermitMutation,
  useRemoveWaterFromPermitMutation,
  useUpdatePermitMutation,
} from '~/actions/permits/mutations'
import { usePermitByIdQuery } from '~/actions/permits/queries'

export const permitFormSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name darf maximal 100 Zeichen lang sein'),
})

export interface PermitFormState {
  name: string
  selectedWaterIds: string[]
}

const defaultState = (): PermitFormState => ({
  name: '',
  selectedWaterIds: [],
})

export const usePermitPageForm = () => {
  const route = useRoute()
  const toast = useToast()
  const { club, getClubWaters } = useClub()

  // Mode detection via route param
  const permitId = computed(() => route.params.permitId as string | undefined)
  const isCreateMode = computed(() => permitId.value === 'new')
  const isEditMode = computed(() => !!permitId.value && permitId.value !== 'new')

  // Form state
  const state = reactive<PermitFormState>(defaultState())

  // Track original water IDs for diffing on submit
  const originalWaterIds = ref<string[]>([])

  // Get clubId
  const clubId = computed(() => club.value?.id)
  const clubSlug = computed(() => club.value?.slug)

  // Fetch permit data in edit mode
  const { data: permitData, isLoading: isPermitLoading } = useQuery(usePermitByIdQuery, () => ({
    clubId: clubId.value!,
    permitId: permitId.value!,
  }))

  // Fetch club waters for selection
  const { data: clubWaters } = getClubWaters()

  // Water options for USwitch list
  const waterOptions = computed(() =>
    clubWaters.value?.map(water => ({
      value: water.id,
      name: water.name,
      typeLabel: water.type === 'lotic' ? 'Fließgewässer' : 'Stillgewässer',
    })) ?? [],
  )

  // Single watcher for form population
  watch([isCreateMode, permitData], ([isCreate, permit]) => {
    if (isCreate) {
      Object.assign(state, defaultState())
      originalWaterIds.value = []
    }
    else if (permit) {
      state.name = permit.name || ''
      state.selectedWaterIds = permit.waters.map(w => w.waterId)
      originalWaterIds.value = [...state.selectedWaterIds]
    }
  }, { immediate: true })

  // Mutations
  const createMutation = useCreatePermitMutation()
  const updateMutation = useUpdatePermitMutation()
  const assignWaterMutation = useAssignWaterToPermitMutation()
  const removeWaterMutation = useRemoveWaterFromPermitMutation()

  const isLoading = computed(() =>
    createMutation.isLoading.value
    || updateMutation.isLoading.value
    || assignWaterMutation.isLoading.value
    || removeWaterMutation.isLoading.value,
  )

  // Submit handler
  const submit = async () => {
    const currentClubId = clubId.value
    const currentSlug = clubSlug.value
    const currentPermitId = permitId.value
    if (!currentClubId || !currentSlug)
      return

    try {
      if (isCreateMode.value) {
        // Create permit and redirect to edit page
        const result = await createMutation.mutateAsync({
          clubId: currentClubId,
          name: state.name.trim(),
        })

        toast.add({
          title: 'Erlaubnisschein erstellt',
          description: `${state.name} wurde erfolgreich erstellt.`,
          color: 'success',
        })

        // Redirect to edit page to add options
        if (result?.id) {
          await navigateTo(`/verein/${currentSlug}/_admin/permits/${result.id}`)
        }
      }
      else if (isEditMode.value && currentPermitId) {
        // Update permit name
        await updateMutation.mutateAsync({
          clubId: currentClubId,
          permitId: currentPermitId,
          name: state.name.trim(),
        })

        // Diff water assignments
        const original = new Set(originalWaterIds.value)
        const current = new Set(state.selectedWaterIds)

        const toAdd = [...current].filter(id => !original.has(id))
        const toRemove = [...original].filter(id => !current.has(id))

        // Execute water changes in parallel
        await Promise.all([
          ...toAdd.map(waterId => assignWaterMutation.mutateAsync({
            clubId: currentClubId,
            permitId: currentPermitId,
            waterId,
          })),
          ...toRemove.map(waterId => removeWaterMutation.mutateAsync({
            clubId: currentClubId,
            permitId: currentPermitId,
            waterId,
          })),
        ])

        toast.add({
          title: 'Erlaubnisschein aktualisiert',
          description: `${state.name} wurde erfolgreich aktualisiert.`,
          color: 'success',
        })

        // Navigate back to permits list
        await navigateTo(`/verein/${currentSlug}/_admin/permits`)
      }
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.'
      toast.add({
        title: 'Fehler',
        description: message,
        color: 'error',
      })
    }
  }

  return {
    // Mode
    permitId,
    isCreateMode,
    isEditMode,
    // State
    state,
    permitData,
    originalWaterIds,
    // Waters
    waterOptions,
    clubWaters,
    // Loading
    isLoading,
    isPermitLoading,
    // Actions
    submit,
  }
}
