<script lang="ts" setup>
import {
  useAssignWaterToPermitMutation,
  useCreatePermitMutation,
  useRemoveWaterFromPermitMutation,
  useUpdatePermitMutation,
} from '~/actions/permits/mutations'
import { usePermitByIdQuery } from '~/actions/permits/queries'

const route = useRoute()
const { club, clubSlug, getClubWaters } = useClub()

const permitId = computed(() => route.params.permitId as string)
const isCreateMode = computed(() => permitId.value === 'new')

// Queries
const { data: permitData, isLoading: isPermitLoading } = useQuery(usePermitByIdQuery, () => ({
  clubId: club.value!.id,
  permitId: permitId.value,
}))

const { data: clubWaters } = getClubWaters()

// Mutations
const createPermitMutation = useCreatePermitMutation()
const updatePermitMutation = useUpdatePermitMutation()
const assignWaterMutation = useAssignWaterToPermitMutation()
const removeWaterMutation = useRemoveWaterFromPermitMutation()

// Form state
const permitName = ref('')
const selectedWaterIds = ref<string[]>([])

// Initialize form when data loads
watch(permitData, (data) => {
  if (data) {
    permitName.value = data.name
    selectedWaterIds.value = data.waters.map(w => w.waterId)
  }
}, { immediate: true })

// Water options for select
const waterOptions = computed(() => {
  return clubWaters.value?.map(water => ({
    label: `${water.name} (${water.type === 'lotic' ? 'Fließgewässer' : 'Stillgewässer'})`,
    value: water.id,
  })) ?? []
})

// Create permit and redirect
async function handleCreatePermit() {
  if (!club.value?.id || !permitName.value.trim())
    return

  const result = await createPermitMutation.mutateAsync({
    clubId: club.value.id,
    name: permitName.value.trim(),
  })

  // Redirect to edit page
  if (result?.id) {
    await navigateTo(`/verein/${clubSlug.value}/_admin/permits/${result.id}`)
  }
}

// Update permit name
async function handleUpdateName() {
  if (!club.value?.id || !permitId.value || isCreateMode.value)
    return

  await updatePermitMutation.mutateAsync({
    clubId: club.value.id,
    permitId: permitId.value,
    name: permitName.value.trim(),
  })
}

// Handle water selection change
async function handleWaterToggle(waterId: string) {
  if (!club.value?.id || !permitId.value || isCreateMode.value)
    return

  const isCurrentlyAssigned = selectedWaterIds.value.includes(waterId)

  if (isCurrentlyAssigned) {
    await removeWaterMutation.mutateAsync({
      clubId: club.value.id,
      permitId: permitId.value,
      waterId,
    })
    selectedWaterIds.value = selectedWaterIds.value.filter(id => id !== waterId)
  }
  else {
    await assignWaterMutation.mutateAsync({
      clubId: club.value.id,
      permitId: permitId.value,
      waterId,
    })
    selectedWaterIds.value = [...selectedWaterIds.value, waterId]
  }
}

function goBack() {
  navigateTo(`/verein/${clubSlug.value}/_admin/permits`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        @click="goBack"
      />
      <h1 class="text-2xl font-bold">
        {{ isCreateMode ? 'Neuer Erlaubnisschein' : 'Erlaubnisschein bearbeiten' }}
      </h1>
    </div>

    <!-- Loading state -->
    <div v-if="!isCreateMode && isPermitLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    </div>

    <template v-else>
      <!-- General Section -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Allgemein
          </h2>
        </template>

        <div class="space-y-4">
          <UFormField label="Name" required>
            <UInput
              v-model="permitName"
              placeholder="z.B. Tageskarte, Jahreskarte..."
              class="w-full"
              @blur="!isCreateMode && handleUpdateName()"
            />
          </UFormField>

          <div v-if="isCreateMode" class="flex justify-end">
            <UButton
              :loading="createPermitMutation.isLoading.value"
              :disabled="!permitName.trim()"
              @click="handleCreatePermit"
            >
              Erlaubnisschein erstellen
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Waters Section (only in edit mode) -->
      <UCard v-if="!isCreateMode">
        <template #header>
          <h2 class="text-lg font-semibold">
            Gewässer
          </h2>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-muted">
            Wähle die Gewässer aus, für die dieser Erlaubnisschein gilt.
          </p>

          <div v-if="waterOptions.length === 0" class="text-sm text-muted">
            Keine Gewässer verfügbar. Bitte füge zuerst Gewässer zum Verein hinzu.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="option in waterOptions"
              :key="option.value"
              class="flex items-center gap-2"
            >
              <UCheckbox
                :model-value="selectedWaterIds.includes(option.value)"
                :label="option.label"
                @update:model-value="handleWaterToggle(option.value)"
              />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Options Section (only in edit mode) -->
      <PermitOptionsSection
        v-if="!isCreateMode && club?.id"
        :club-id="club.id"
        :permit-id="permitId"
        :options="permitData?.options ?? []"
        :club-slug="clubSlug"
      />
    </template>
  </div>
</template>
