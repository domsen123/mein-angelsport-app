import type { DateValue } from '@internationalized/date'
import * as z from 'zod'
import { useCreateClubMemberMutation, useUpdateClubMemberMutation } from '~/actions/clubMembers/mutations'
import { useClubMemberByIdQuery } from '~/actions/clubMembers/queries'

export const memberFormSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich').max(30, 'Vorname darf maximal 30 Zeichen lang sein'),
  lastName: z.string().min(1, 'Nachname ist erforderlich').max(30, 'Nachname darf maximal 30 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse').nullish().or(z.literal('')),
  phone: z.string().min(5, 'Telefonnummer muss mindestens 5 Zeichen haben').max(20).nullish().or(z.literal('')),
  birthdate: z.custom<DateValue>().nullable().optional(),
  street: z.string().min(5, 'Straße muss mindestens 5 Zeichen haben').max(100).nullish().or(z.literal('')),
  postalCode: z.string().min(4, 'PLZ muss mindestens 4 Zeichen haben').max(10).nullish().or(z.literal('')),
  city: z.string().min(2, 'Stadt muss mindestens 2 Zeichen haben').max(50).nullish().or(z.literal('')),
  country: z.string().min(2).max(50).nullish(),
  preferredInvoicingMethod: z.enum(['email', 'postal_mail']).default('email'),
})

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

export const useMemberPageForm = () => {
  const route = useRoute()
  const toast = useToast()
  const { club } = useClub()

  // Mode detection via route param
  const memberId = computed(() => route.params.memberId as string | undefined)
  const isCreateMode = computed(() => memberId.value === 'new')
  const isEditMode = computed(() => !!memberId.value && memberId.value !== 'new')

  // Form state
  const state = reactive<MemberFormState>(defaultState())

  // Get clubId
  const clubId = computed(() => club.value?.id)
  const clubSlug = computed(() => club.value?.slug)

  // Fetch member data in edit mode
  const { data: memberData, isLoading: isMemberLoading } = useQuery(useClubMemberByIdQuery, () => ({
    clubId: clubId.value!,
    memberId: memberId.value!,
  }))

  // Single watcher for form population
  watch([isCreateMode, memberData], ([isCreate, member]) => {
    if (isCreate) {
      Object.assign(state, defaultState())
    }
    else if (member) {
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

  // Mutations
  const createMutation = useCreateClubMemberMutation()
  const updateMutation = useUpdateClubMemberMutation()

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
      // Navigate back to members list
      await navigateTo(`/verein/${currentSlug}/_admin/members`)
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
    memberId,
    isCreateMode,
    isEditMode,
    // State
    state,
    memberData,
    // Loading
    isLoading,
    isMemberLoading,
    // Actions
    submit,
  }
}
