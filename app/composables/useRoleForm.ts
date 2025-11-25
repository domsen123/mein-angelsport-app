import type { MaybeRef } from 'vue'
import { useCreateClubRoleMutation, useUpdateClubRoleMutation } from '~/actions/clubRoles/mutations'
import { useClubRoleByIdQuery } from '~/actions/clubRoles/queries'

export interface RoleFormState {
  name: string
  description: string | null
  isClubAdmin: boolean
  isExemptFromWorkDuties: boolean
}

const defaultState = (): RoleFormState => ({
  name: '',
  description: null,
  isClubAdmin: false,
  isExemptFromWorkDuties: false,
})

export function useRoleForm(clubId: MaybeRef<string | undefined>) {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  // Mode detection
  const roleId = computed(() => route.query.roleId as string | undefined)
  const isCreateMode = computed(() => roleId.value === 'new')
  const isEditMode = computed(() => !!roleId.value && roleId.value !== 'new')
  const isOpen = computed(() => !!roleId.value)

  // Form state
  const state = reactive<RoleFormState>(defaultState())

  // Get clubId as ref
  const clubIdRef = computed(() => toValue(clubId))

  // Fetch role data in edit mode
  const { data: roleData, isLoading: isRoleLoading } = useQuery(useClubRoleByIdQuery, () => ({
    clubId: clubIdRef.value!,
    roleId: roleId.value!,
  }))

  // Watch role data to populate form
  watch(roleData, (role) => {
    if (role) {
      state.name = role.name || ''
      state.description = role.description || null
      state.isClubAdmin = role.isClubAdmin || false
      state.isExemptFromWorkDuties = role.isExemptFromWorkDuties || false
    }
  }, { immediate: true })

  // Reset form when switching to create mode
  watch(isCreateMode, (isCreate) => {
    if (isCreate) {
      Object.assign(state, defaultState())
    }
  }, { immediate: true })

  // Mutations
  const createMutation = useCreateClubRoleMutation()
  const updateMutation = useUpdateClubRoleMutation()

  const isLoading = computed(() =>
    isRoleLoading.value
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
          isClubAdmin: state.isClubAdmin,
          isExemptFromWorkDuties: state.isExemptFromWorkDuties,
        })
        toast.add({
          title: 'Gruppe erstellt',
          description: `${state.name} wurde erfolgreich hinzugefügt.`,
          color: 'success',
        })
      }
      else if (isEditMode.value && roleId.value) {
        await updateMutation.mutateAsync({
          clubId: currentClubId,
          roleId: roleId.value,
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
    delete query.roleId
    router.replace({ query })
  }

  // Open handlers
  function openCreate() {
    router.push({ query: { ...route.query, roleId: 'new' } })
  }

  function openEdit(id: string) {
    router.push({ query: { ...route.query, roleId: id } })
  }

  return {
    // Mode
    roleId,
    isCreateMode,
    isEditMode,
    isOpen,
    // State
    state,
    roleData,
    // Loading
    isLoading,
    isRoleLoading,
    // Actions
    submit,
    close,
    openCreate,
    openEdit,
  }
}
