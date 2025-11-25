<script lang="ts" setup>
import type { PermitOption } from '~/types/permit'
import {
  useCreatePermitOptionPeriodMutation,
  useDeletePermitOptionMutation,
  useUpdatePermitOptionMutation,
} from '~/actions/permits/mutations'

const props = defineProps<{
  clubId: string
  permitId: string
  option: PermitOption
  clubSlug: string
}>()

const toast = useToast()

const isExpanded = ref(true)
const optionName = ref(props.option.name ?? '')
const optionDescription = ref(props.option.description ?? '')

// Sync with props
watch(() => props.option, (newOption) => {
  optionName.value = newOption.name ?? ''
  optionDescription.value = newOption.description ?? ''
}, { immediate: true })

const updateOptionMutation = useUpdatePermitOptionMutation()
const deleteOptionMutation = useDeletePermitOptionMutation()
const createPeriodMutation = useCreatePermitOptionPeriodMutation()

// Computed: loading state for disabling inputs
const isUpdating = computed(() =>
  updateOptionMutation.isLoading.value
  || deleteOptionMutation.isLoading.value
  || createPeriodMutation.isLoading.value,
)

async function handleUpdateOption() {
  try {
    await updateOptionMutation.mutateAsync({
      clubId: props.clubId,
      permitId: props.permitId,
      optionId: props.option.id,
      name: optionName.value.trim() || undefined,
      description: optionDescription.value.trim() || undefined,
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler beim Speichern',
      description: error?.message || 'Die Änderungen konnten nicht gespeichert werden.',
      color: 'error',
    })
  }
}

async function handleDeleteOption() {
  // eslint-disable-next-line no-alert
  if (!window.confirm('Möchtest du diese Option wirklich löschen? Alle zugehörigen Zeiträume werden ebenfalls gelöscht.'))
    return

  try {
    await deleteOptionMutation.mutateAsync({
      clubId: props.clubId,
      permitId: props.permitId,
      optionId: props.option.id,
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler beim Löschen',
      description: error?.message || 'Die Option konnte nicht gelöscht werden.',
      color: 'error',
    })
  }
}

async function handleAddPeriod() {
  // Get current year for default dates
  const now = new Date()
  const year = now.getFullYear()

  try {
    await createPeriodMutation.mutateAsync({
      clubId: props.clubId,
      permitId: props.permitId,
      optionId: props.option.id,
      validFrom: `${year}-01-01`,
      validTo: `${year}-12-31`,
      priceCents: '0',
      permitNumberStart: 1,
      permitNumberEnd: 100,
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler beim Erstellen',
      description: error?.message || 'Der Zeitraum konnte nicht erstellt werden.',
      color: 'error',
    })
  }
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <UPageCard variant="subtle">
    <!-- Option Header -->
    <div
      class="flex items-center justify-between cursor-pointer"
      @click="toggleExpand"
    >
      <div class="flex items-center gap-3">
        <UIcon
          :name="isExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
          class="size-5 text-muted"
        />
        <div>
          <div class="font-medium">
            {{ option.name || 'Unbenannte Option' }}
          </div>
          <div v-if="option.description" class="text-sm text-muted">
            {{ option.description }}
          </div>
          <div class="text-xs text-muted">
            {{ option.periods.length }} Zeiträume
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2" @click.stop>
        <UButton
          icon="i-lucide-trash-2"
          size="sm"
          color="error"
          variant="ghost"
          :loading="deleteOptionMutation.isLoading.value"
          :disabled="updateOptionMutation.isLoading.value || createPeriodMutation.isLoading.value"
          @click="handleDeleteOption"
        >
          Option löschen
        </UButton>
      </div>
    </div>

    <!-- Option Content (expanded) -->
    <div v-if="isExpanded" class="mt-4 space-y-4">
      <!-- Option Fields -->
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Name">
          <UInput
            v-model="optionName"
            placeholder="z.B. Mitglied, Gastangler..."
            class="w-full"
            :disabled="isUpdating"
            @blur="handleUpdateOption"
          />
        </UFormField>

        <UFormField label="Beschreibung">
          <UInput
            v-model="optionDescription"
            placeholder="Optionale Beschreibung"
            class="w-full"
            :disabled="isUpdating"
            @blur="handleUpdateOption"
          />
        </UFormField>
      </div>

      <!-- Periods Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-sm">
            Zeiträume
          </h4>
          <UButton
            icon="i-lucide-plus"
            size="xs"
            variant="outline"
            aria-label="Neuen Zeitraum hinzufügen"
            :loading="createPeriodMutation.isLoading.value"
            :disabled="updateOptionMutation.isLoading.value || deleteOptionMutation.isLoading.value"
            @click="handleAddPeriod"
          >
            Zeitraum hinzufügen
          </UButton>
        </div>

        <div v-if="option.periods.length === 0" class="py-4 text-center text-sm text-muted">
          Noch keine Zeiträume vorhanden.
        </div>

        <div v-else class="space-y-2">
          <PermitPeriodItem
            v-for="period in option.periods"
            :key="period.id"
            :club-id="clubId"
            :permit-id="permitId"
            :option-id="option.id"
            :period="period"
            :club-slug="clubSlug"
          />
        </div>
      </div>
    </div>
  </UPageCard>
</template>
