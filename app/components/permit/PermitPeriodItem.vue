<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import type { PermitOptionPeriod } from '~/types/permit'
import { CalendarDate } from '@internationalized/date'
import {
  useDeletePermitOptionPeriodMutation,
  useUpdatePermitOptionPeriodMutation,
} from '~/actions/permits/mutations'

const props = defineProps<{
  clubId: string
  permitId: string
  optionId: string
  period: PermitOptionPeriod
  clubSlug: string
}>()

const toast = useToast()

// Helper functions
function dateToDateValue(date: Date | string | null): DateValue | undefined {
  if (!date)
    return undefined

  if (typeof date === 'string') {
    // Parse ISO date string directly to avoid timezone issues
    const datePart = date.split('T')[0]
    if (!datePart)
      return undefined
    const parts = datePart.split('-').map(Number)
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]
    if (year && month && day) {
      return new CalendarDate(year, month, day)
    }
    return undefined
  }

  const d = date as Date
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function dateValueToIsoString(date: DateValue | undefined): string | undefined {
  if (!date)
    return undefined
  const month = String(date.month).padStart(2, '0')
  const day = String(date.day).padStart(2, '0')
  return `${date.year}-${month}-${day}`
}

function formatCentsToEuro(cents: string): string {
  const num = Number.parseInt(cents, 10)
  if (Number.isNaN(num))
    return '0,00'
  return (num / 100).toFixed(2).replace('.', ',')
}

function euroToCents(euro: string): string {
  // Remove currency symbol and spaces, handle comma as decimal separator
  const cleaned = euro.replace(/[€\s]/g, '').replace(',', '.')
  const num = Number.parseFloat(cleaned)
  if (Number.isNaN(num))
    return '0'
  return Math.round(num * 100).toString()
}

// Local state - initialized by watcher with immediate: true
const validFrom = ref<DateValue | undefined>()
const validTo = ref<DateValue | undefined>()
const priceEuro = ref('')
const permitNumberStart = ref(0)
const permitNumberEnd = ref(0)

// Dirty state tracking to prevent race conditions
const isDirty = ref(false)

// Sync with props - only when not dirty to prevent overwriting user edits
watch(() => props.period, (newPeriod) => {
  if (!isDirty.value) {
    validFrom.value = dateToDateValue(newPeriod.validFrom)
    validTo.value = dateToDateValue(newPeriod.validTo)
    priceEuro.value = formatCentsToEuro(newPeriod.priceCents)
    permitNumberStart.value = newPeriod.permitNumberStart
    permitNumberEnd.value = newPeriod.permitNumberEnd
  }
}, { immediate: true })

const updatePeriodMutation = useUpdatePermitOptionPeriodMutation()
const deletePeriodMutation = useDeletePermitOptionPeriodMutation()

// Computed: loading state
const isUpdating = computed(() =>
  updatePeriodMutation.isLoading.value || deletePeriodMutation.isLoading.value,
)

// Computed: validation errors
const validationErrors = computed(() => {
  const errors: string[] = []

  if (validFrom.value && validTo.value) {
    const fromStr = dateValueToIsoString(validFrom.value)!
    const toStr = dateValueToIsoString(validTo.value)!
    if (fromStr > toStr) {
      errors.push('Gültig von muss vor Gültig bis liegen')
    }
  }

  if (permitNumberStart.value > permitNumberEnd.value) {
    errors.push('Nummer von muss kleiner oder gleich Nummer bis sein')
  }

  return errors
})

const isValid = computed(() => validationErrors.value.length === 0)

// Check if values have changed from props
function hasChanges(): boolean {
  const propValidFrom = props.period.validFrom
    ? (typeof props.period.validFrom === 'string' ? props.period.validFrom.split('T')[0] : undefined)
    : undefined
  const propValidTo = props.period.validTo
    ? (typeof props.period.validTo === 'string' ? props.period.validTo.split('T')[0] : undefined)
    : undefined

  return (
    dateValueToIsoString(validFrom.value) !== propValidFrom
    || dateValueToIsoString(validTo.value) !== propValidTo
    || euroToCents(priceEuro.value) !== props.period.priceCents
    || permitNumberStart.value !== props.period.permitNumberStart
    || permitNumberEnd.value !== props.period.permitNumberEnd
  )
}

// Mark as dirty when user changes input
function markDirty() {
  isDirty.value = true
}

async function handleUpdate() {
  // Skip if no changes or invalid
  if (!hasChanges()) {
    isDirty.value = false
    return
  }

  if (!isValid.value) {
    return
  }

  try {
    await updatePeriodMutation.mutateAsync({
      clubId: props.clubId,
      permitId: props.permitId,
      optionId: props.optionId,
      periodId: props.period.id,
      validFrom: dateValueToIsoString(validFrom.value),
      validTo: dateValueToIsoString(validTo.value),
      priceCents: euroToCents(priceEuro.value),
      permitNumberStart: permitNumberStart.value,
      permitNumberEnd: permitNumberEnd.value,
    })
    isDirty.value = false
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler beim Speichern',
      description: error?.message || 'Die Änderungen konnten nicht gespeichert werden.',
      color: 'error',
    })
  }
}

async function handleDelete() {
  // eslint-disable-next-line no-alert
  if (!window.confirm('Möchtest du diesen Zeitraum wirklich löschen?'))
    return

  try {
    await deletePeriodMutation.mutateAsync({
      clubId: props.clubId,
      permitId: props.permitId,
      optionId: props.optionId,
      periodId: props.period.id,
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler beim Löschen',
      description: error?.message || 'Der Zeitraum konnte nicht gelöscht werden.',
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="bg-muted/30 rounded-lg p-4 relative">
    <!-- Saving indicator -->
    <UIcon
      v-if="updatePeriodMutation.isLoading.value"
      name="i-lucide-loader-2"
      class="absolute top-3 right-3 size-4 animate-spin text-muted-foreground"
    />

    <!-- Row 1: Dates and Price -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UFormField label="Gültig von">
        <UInputDate
          v-model="validFrom"
          class="w-full"
          :disabled="isUpdating"
          @update:model-value="markDirty(); handleUpdate()"
        />
      </UFormField>

      <UFormField label="Gültig bis">
        <UInputDate
          v-model="validTo"
          class="w-full"
          :disabled="isUpdating"
          @update:model-value="markDirty(); handleUpdate()"
        />
      </UFormField>

      <UFormField label="Preis (€)">
        <UInput
          v-model="priceEuro"
          placeholder="0,00"
          class="w-full"
          :disabled="isUpdating"
          @input="markDirty"
          @blur="handleUpdate"
        />
      </UFormField>
    </div>

    <!-- Row 2: Permit Numbers -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <UFormField label="Kartennummer von">
        <UInput
          v-model.number="permitNumberStart"
          type="number"
          min="1"
          class="w-full"
          :disabled="isUpdating"
          @input="markDirty"
          @blur="handleUpdate"
        />
      </UFormField>

      <UFormField label="Kartennummer bis">
        <UInput
          v-model.number="permitNumberEnd"
          type="number"
          min="1"
          class="w-full"
          :disabled="isUpdating"
          @input="markDirty"
          @blur="handleUpdate"
        />
      </UFormField>
    </div>

    <!-- Row 3: Actions -->
    <div class="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-muted">
      <UButton
        icon="i-lucide-ticket"
        variant="soft"
        color="primary"
        :to="`/verein/${props.clubSlug}/_admin/permits/${props.permitId}/periods/${props.period.id}/instances?optionId=${props.optionId}`"
        :disabled="isUpdating"
      >
        Karten verwalten
      </UButton>

      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        :loading="deletePeriodMutation.isLoading.value"
        :disabled="updatePeriodMutation.isLoading.value"
        @click="handleDelete"
      >
        Zeitraum löschen
      </UButton>
    </div>

    <!-- Validation Errors -->
    <div v-if="validationErrors.length" class="mt-3 text-sm text-error">
      {{ validationErrors.join(', ') }}
    </div>
  </div>
</template>
