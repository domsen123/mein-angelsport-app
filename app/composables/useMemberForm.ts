import type { MaybeRef } from 'vue'
import { useCreateClubMemberMutation, useUpdateClubMemberMutation } from '~/actions/clubMembers/mutations'
import { useClubMemberByIdQuery } from '~/actions/clubMembers/queries'

export interface MemberFormState {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  birthdate: Date | null
  street: string | null
  postalCode: string | null
  city: string | null
  country: string | null
  preferredInvoicingMethod: 'email' | 'postal_mail'
}

const defaultState = (): MemberFormState => ({
  firstName: '',
  lastName: '',
  email: null,
  phone: null,
  birthdate: null,
  street: null,
  postalCode: null,
  city: null,
  country: 'Germany',
  preferredInvoicingMethod: 'email',
})

export function useMemberForm(clubId: MaybeRef<string | undefined>) {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  // Mode detection
  const memberId = computed(() => route.query.memberId as string | undefined)
  const isCreateMode = computed(() => memberId.value === 'new')
  const isEditMode = computed(() => !!memberId.value && memberId.value !== 'new')
  const isOpen = computed(() => !!memberId.value)

  // Form state
  const state = reactive<MemberFormState>(defaultState())

  // Get clubId as ref
  const clubIdRef = computed(() => toValue(clubId))

  // Fetch member data in edit mode
  const { data: memberData, isLoading: isMemberLoading } = useQuery(useClubMemberByIdQuery, () => ({
    clubId: clubIdRef.value!,
    memberId: memberId.value!,
  }))

  // Watch member data to populate form
  watch(memberData, (member) => {
    if (member) {
      state.firstName = member.firstName || ''
      state.lastName = member.lastName || ''
      state.email = member.email || null
      state.phone = member.phone || null
      state.birthdate = member.birthdate ? new Date(member.birthdate) : null
      state.street = member.street || null
      state.postalCode = member.postalCode || null
      state.city = member.city || null
      state.country = member.country || 'Germany'
      state.preferredInvoicingMethod = member.preferredInvoicingMethod || 'email'
    }
  }, { immediate: true })

  // Reset form when switching to create mode
  watch(isCreateMode, (isCreate) => {
    if (isCreate) {
      Object.assign(state, defaultState())
    }
  }, { immediate: true })

  // Mutations
  const createMutation = useCreateClubMemberMutation()
  const updateMutation = useUpdateClubMemberMutation()

  const isLoading = computed(() =>
    isMemberLoading.value
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
          ...state,
        })
        toast.add({
          title: 'Mitglied erstellt',
          description: `${state.firstName} ${state.lastName} wurde erfolgreich hinzugefügt.`,
          color: 'success',
        })
      }
      else if (isEditMode.value && memberId.value) {
        await updateMutation.mutateAsync({
          clubId: currentClubId,
          memberId: memberId.value,
          ...state,
        })
        toast.add({
          title: 'Mitglied aktualisiert',
          description: `${state.firstName} ${state.lastName} wurde erfolgreich aktualisiert.`,
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
    delete query.memberId
    router.replace({ query })
  }

  // Open handlers
  function openCreate() {
    router.push({ query: { ...route.query, memberId: 'new' } })
  }

  function openEdit(id: string) {
    router.push({ query: { ...route.query, memberId: id } })
  }

  return {
    // Mode
    memberId,
    isCreateMode,
    isEditMode,
    isOpen,
    // State
    state,
    memberData,
    // Loading
    isLoading,
    isMemberLoading,
    // Actions
    submit,
    close,
    openCreate,
    openEdit,
  }
}
