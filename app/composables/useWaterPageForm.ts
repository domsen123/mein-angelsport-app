import * as z from 'zod'
import { useCreateWaterMutation, useUpdateWaterMutation } from '~/actions/waters/mutations'
import { useWaterByIdQuery } from '~/actions/waters/queries'

export const waterFormSchema = z.object({
  type: z.enum(['lotic', 'lentic']),
  name: z.string().min(1, 'Gewässername ist erforderlich').max(100, 'Name darf maximal 100 Zeichen lang sein'),
  postCode: z.string().min(1, 'Postleitzahl ist erforderlich').max(10, 'Postleitzahl darf maximal 10 Zeichen lang sein'),
})

export type WaterFormState = z.infer<typeof waterFormSchema>

const defaultState = (): WaterFormState => ({
  type: 'lentic',
  name: '',
  postCode: '',
})

export const useWaterPageForm = () => {
  const route = useRoute()
  const toast = useToast()
  const { club } = useClub()

  // Mode detection via route param
  const waterId = computed(() => route.params.waterId as string | undefined)
  const isCreateMode = computed(() => waterId.value === 'new')
  const isEditMode = computed(() => !!waterId.value && waterId.value !== 'new')

  // Form state
  const state = reactive<WaterFormState>(defaultState())

  // Get clubId
  const clubId = computed(() => club.value?.id)
  const clubSlug = computed(() => club.value?.slug)

  // Fetch water data in edit mode
  const { data: waterData, isLoading: isWaterLoading } = useQuery(useWaterByIdQuery, () => ({
    clubId: clubId.value!,
    waterId: waterId.value!,
  }))

  // Single watcher for form population
  watch([isCreateMode, waterData], ([isCreate, water]) => {
    if (isCreate) {
      Object.assign(state, defaultState())
    }
    else if (water) {
      state.type = water.type || 'lentic'
      state.name = water.name || ''
      state.postCode = water.postCode || ''
    }
  }, { immediate: true })

  // Mutations
  const createMutation = useCreateWaterMutation()
  const updateMutation = useUpdateWaterMutation()

  const isLoading = computed(() =>
    createMutation.isLoading.value
    || updateMutation.isLoading.value,
  )

  // Submit handler
  const submit = async () => {
    const currentClubId = clubId.value
    const currentSlug = clubSlug.value
    if (!currentClubId || !currentSlug)
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
      // Navigate back to waters list
      await navigateTo(`/verein/${currentSlug}/_admin/waters`)
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
    waterId,
    isCreateMode,
    isEditMode,
    // State
    state,
    waterData,
    // Loading
    isLoading,
    isWaterLoading,
    // Actions
    submit,
  }
}
