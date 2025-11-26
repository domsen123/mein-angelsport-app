import * as z from 'zod'
import { useCreateClubRoleMutation, useUpdateClubRoleMutation } from '~/actions/clubRoles/mutations'
import { useClubRoleByIdQuery } from '~/actions/clubRoles/queries'

export const groupFormSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(40, 'Name darf maximal 40 Zeichen lang sein'),
  description: z.string().max(200, 'Beschreibung darf maximal 200 Zeichen lang sein').nullish().transform(v => v || null),
  isClubAdmin: z.boolean(),
  isExemptFromWorkDuties: z.boolean(),
})

export type GroupFormState = z.infer<typeof groupFormSchema>

const defaultState = (): GroupFormState => ({
  name: '',
  description: null,
  isClubAdmin: false,
  isExemptFromWorkDuties: false,
})

export const useGroupPageForm = () => {
  const route = useRoute()
  const toast = useToast()
  const { club } = useClub()

  // Mode detection via route param
  const groupId = computed(() => route.params.groupId as string | undefined)
  const isCreateMode = computed(() => groupId.value === 'new')
  const isEditMode = computed(() => !!groupId.value && groupId.value !== 'new')

  // Form state
  const state = reactive<GroupFormState>(defaultState())

  // Get clubId
  const clubId = computed(() => club.value?.id)
  const clubSlug = computed(() => club.value?.slug)
  const members = ref<string[]>([])

  // Fetch role data in edit mode
  const { data: roleData, isLoading: isRoleLoading } = useQuery(useClubRoleByIdQuery, () => ({
    clubId: clubId.value!,
    roleId: groupId.value!,
  }))

  const memberList = computed(() => {
    return roleData.value?.members.map(m => m.member) || []
  })

  // Single watcher for form population
  watch([isCreateMode, roleData], ([isCreate, role]) => {
    if (isCreate) {
      Object.assign(state, defaultState())
    }
    else if (role) {
      state.name = role.name || ''
      state.description = role.description || null
      state.isClubAdmin = role.isClubAdmin || false
      state.isExemptFromWorkDuties = role.isExemptFromWorkDuties || false
    }
  }, { immediate: true })

  // Mutations
  const createMutation = useCreateClubRoleMutation()
  const updateMutation = useUpdateClubRoleMutation()

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
          name: state.name,
          description: state.description || undefined,
          isClubAdmin: state.isClubAdmin,
          isExemptFromWorkDuties: state.isExemptFromWorkDuties,
        })
        toast.add({
          title: 'Gruppe erstellt',
          description: `${state.name} wurde erfolgreich hinzugefügt.`,
          color: 'success',
        })
      }
      else if (isEditMode.value && groupId.value) {
        await updateMutation.mutateAsync({
          clubId: currentClubId,
          roleId: groupId.value,
          name: state.name,
          description: state.description,
          isClubAdmin: state.isClubAdmin,
          isExemptFromWorkDuties: state.isExemptFromWorkDuties,
        })
        toast.add({
          title: 'Gruppe aktualisiert',
          description: `${state.name} wurde erfolgreich aktualisiert.`,
          color: 'success',
        })
      }
      // Navigate back to groups list
      await navigateTo(`/verein/${currentSlug}/_admin/groups`)
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
    groupId,
    isCreateMode,
    isEditMode,
    // State
    state,
    roleData,
    members,
    memberList,
    // Loading
    isLoading,
    isRoleLoading,
    // Actions
    submit,
  }
}
