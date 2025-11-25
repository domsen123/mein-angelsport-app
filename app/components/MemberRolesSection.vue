<script lang="ts" setup>
import type { GetClubMemberByIdResponse } from '~~/server/actions/clubMember/get-club-member-by-id'
import { useAssignRoleToMemberMutation, useRemoveRoleFromMemberMutation } from '~/actions/clubMembers/mutations'

const props = withDefaults(defineProps<{
  clubId: string
  memberId: string
  memberRoles: GetClubMemberByIdResponse['roles']
  showAccordion?: boolean
}>(), {
  showAccordion: true,
})

const toast = useToast()
const { getRoles } = useClub()
const { pagination } = usePagination()

// Fetch all available roles for the club
const { data: rolesData } = getRoles(pagination)

// Selected role for adding
const selectedRole = ref<string | undefined>(undefined)

// Computed: assigned role IDs for filtering
const assignedRoleIds = computed(() => new Set(props.memberRoles.map(r => r.roleId)))

// Computed: available roles (not yet assigned)
const availableRoles = computed(() => {
  if (!rolesData.value?.items)
    return []
  return rolesData.value.items
    .filter(role => !assignedRoleIds.value.has(role.id))
    .map(role => ({
      label: role.name,
      value: role.id,
    }))
})

// Mutations
const assignRoleMutation = useAssignRoleToMemberMutation()
const removeRoleMutation = useRemoveRoleFromMemberMutation()

async function addRole() {
  if (!selectedRole.value)
    return

  try {
    await assignRoleMutation.mutateAsync({
      clubId: props.clubId,
      memberId: props.memberId,
      roleId: selectedRole.value,
    })
    selectedRole.value = undefined
    toast.add({
      title: 'Rolle zugewiesen',
      color: 'success',
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler',
      description: error?.message || 'Rolle konnte nicht zugewiesen werden.',
      color: 'error',
    })
  }
}

async function removeRole(roleId: string) {
  try {
    await removeRoleMutation.mutateAsync({
      clubId: props.clubId,
      memberId: props.memberId,
      roleId,
    })
    toast.add({
      title: 'Rolle entfernt',
      color: 'success',
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler',
      description: error?.message || 'Rolle konnte nicht entfernt werden.',
      color: 'error',
    })
  }
}

const accordionItems = [
  {
    label: 'Gruppen / Rollen',
    icon: 'i-lucide-users',
  },
]
</script>

<template>
  <!-- With accordion wrapper -->
  <div v-if="showAccordion" class="mt-6 border-t border-default pt-4">
    <UAccordion :items="accordionItems" default-value="0">
      <template #body>
        <!-- Assigned roles -->
        <div class="flex flex-wrap gap-2 mb-4">
          <template v-if="memberRoles.length > 0">
            <UBadge
              v-for="memberRole in memberRoles"
              :key="memberRole.roleId"
              :color="memberRole.role.isClubAdmin ? 'success' : 'info'"
              variant="subtle"
              class="flex items-center gap-1"
            >
              {{ memberRole.role.name }}
              <UButton
                icon="i-lucide-x"
                size="xs"
                color="neutral"
                variant="ghost"
                :loading="removeRoleMutation.isLoading.value"
                @click="removeRole(memberRole.roleId)"
              />
            </UBadge>
          </template>
          <span v-else class="text-sm text-muted">
            Keine Rollen zugewiesen
          </span>
        </div>

        <!-- Add role -->
        <div class="flex gap-2">
          <USelectMenu
            v-model="selectedRole"
            :items="availableRoles"
            placeholder="Rolle hinzufügen..."
            class="flex-1"
            value-key="value"
          />
          <UButton
            :disabled="!selectedRole"
            :loading="assignRoleMutation.isLoading.value"
            @click="addRole"
          >
            Hinzufügen
          </UButton>
        </div>
      </template>
    </UAccordion>
  </div>

  <!-- Without accordion wrapper (for full page form) -->
  <div v-else>
    <!-- Assigned roles -->
    <div class="flex flex-wrap gap-2 mb-4">
      <template v-if="memberRoles.length > 0">
        <UBadge
          v-for="memberRole in memberRoles"
          :key="memberRole.roleId"
          :color="memberRole.role.isClubAdmin ? 'success' : 'info'"
          variant="subtle"
          class="flex items-center gap-1"
        >
          {{ memberRole.role.name }}
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            :loading="removeRoleMutation.isLoading.value"
            @click="removeRole(memberRole.roleId)"
          />
        </UBadge>
      </template>
      <span v-else class="text-sm text-muted">
        Keine Rollen zugewiesen
      </span>
    </div>

    <!-- Add role -->
    <div class="flex gap-2">
      <USelectMenu
        v-model="selectedRole"
        :items="availableRoles"
        placeholder="Rolle hinzufügen..."
        class="flex-1"
        value-key="value"
      />
      <UButton
        :disabled="!selectedRole"
        :loading="assignRoleMutation.isLoading.value"
        @click="addRole"
      >
        Hinzufügen
      </UButton>
    </div>
  </div>
</template>
