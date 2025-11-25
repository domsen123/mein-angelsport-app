import type { MaybeRef } from 'vue'
import { useCreateClubEventMutation, useUpdateClubEventMutation } from '~/actions/clubEvents/mutations'
import { useClubEventByIdQuery } from '~/actions/clubEvents/queries'

export interface ClubEventFormState {
  name: string
  description: string | null
  content: string | null
  dateStart: string
  dateEnd: string | null
  isWorkDuty: boolean
  isPublic: boolean
}

const defaultState = (): ClubEventFormState => ({
  name: '',
  description: null,
  content: null,
  dateStart: '',
  dateEnd: null,
  isWorkDuty: false,
  isPublic: true,
})

// Helper to format Date to datetime-local input format (in local timezone)
function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date)
    return ''
  const d = typeof date === 'string' ? new Date(date) : date
  // Format: YYYY-MM-DDTHH:mm in local timezone
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function useClubEventForm(clubId: MaybeRef<string | undefined>) {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  // Mode detection
  const eventId = computed(() => route.query.eventId as string | undefined)
  const isCreateMode = computed(() => eventId.value === 'new')
  const isEditMode = computed(() => !!eventId.value && eventId.value !== 'new')
  const isOpen = computed(() => !!eventId.value)

  // Form state
  const state = reactive<ClubEventFormState>(defaultState())

  // Get clubId as ref
  const clubIdRef = computed(() => toValue(clubId))

  // Fetch event data in edit mode
  const { data: eventData, isLoading: isEventLoading } = useQuery(useClubEventByIdQuery, () => ({
    clubId: clubIdRef.value!,
    eventId: eventId.value!,
  }))

  // Watch event data to populate form
  watch(eventData, (event) => {
    if (event) {
      state.name = event.name || ''
      state.description = event.description || null
      state.content = event.content || null
      state.dateStart = formatDateForInput(event.dateStart)
      state.dateEnd = formatDateForInput(event.dateEnd)
      state.isWorkDuty = event.isWorkDuty || false
      state.isPublic = event.isPublic ?? true
    }
  }, { immediate: true })

  // Reset form when switching to create mode
  watch(isCreateMode, (isCreate) => {
    if (isCreate) {
      Object.assign(state, defaultState())
    }
  }, { immediate: true })

  // Mutations
  const createMutation = useCreateClubEventMutation()
  const updateMutation = useUpdateClubEventMutation()

  const isLoading = computed(() =>
    isEventLoading.value
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
          name: state.name,
          description: state.description || undefined,
          content: state.content || undefined,
          dateStart: new Date(state.dateStart).toISOString(),
          dateEnd: state.dateEnd ? new Date(state.dateEnd).toISOString() : undefined,
          isWorkDuty: state.isWorkDuty,
          isPublic: state.isPublic,
        })
        toast.add({
          title: 'Event erstellt',
          description: `${state.name} wurde erfolgreich hinzugefügt.`,
          color: 'success',
        })
      }
      else if (isEditMode.value && eventId.value) {
        await updateMutation.mutateAsync({
          clubId: currentClubId,
          eventId: eventId.value,
          name: state.name,
          description: state.description,
          content: state.content,
          dateStart: new Date(state.dateStart).toISOString(),
          dateEnd: state.dateEnd ? new Date(state.dateEnd).toISOString() : null,
          isWorkDuty: state.isWorkDuty,
          isPublic: state.isPublic,
        })
        toast.add({
          title: 'Event aktualisiert',
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
    delete query.eventId
    router.replace({ query })
  }

  // Open handlers
  function openCreate() {
    router.push({ query: { ...route.query, eventId: 'new' } })
  }

  function openEdit(id: string) {
    router.push({ query: { ...route.query, eventId: id } })
  }

  return {
    // Mode
    eventId,
    isCreateMode,
    isEditMode,
    isOpen,
    // State
    state,
    eventData,
    // Loading
    isLoading,
    isEventLoading,
    // Actions
    submit,
    close,
    openCreate,
    openEdit,
  }
}
