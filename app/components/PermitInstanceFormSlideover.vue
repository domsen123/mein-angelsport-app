<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

const props = defineProps<{
  clubId: string
  permitId: string
  optionId: string
  periodId: string
}>()

const {
  isOpen,
  state,
  instanceData,
  isLoading,
  isInstanceLoading,
  submit,
  close,
} = usePermitInstanceForm({
  clubId: computed(() => props.clubId),
  permitId: computed(() => props.permitId),
  optionId: computed(() => props.optionId),
  periodId: computed(() => props.periodId),
})

const schema = z.object({
  status: z.enum(['available', 'reserved', 'sold', 'cancelled']),
  ownerMemberId: z.string().nullable().optional(),
  ownerName: z.string().max(100).nullable().optional().or(z.literal('')),
  ownerEmail: z.string().email('Ungültige E-Mail-Adresse').nullable().optional().or(z.literal('')),
  ownerPhone: z.string().max(20).nullable().optional().or(z.literal('')),
  paymentReference: z.string().max(100).nullable().optional().or(z.literal('')),
  paidCents: z.string().nullable().optional().or(z.literal('')),
  notes: z.string().max(1000).nullable().optional().or(z.literal('')),
})

type Schema = z.output<typeof schema>

const onSubmit = async (_event: FormSubmitEvent<Schema>) => {
  await submit()
}

const statusOptions = [
  { label: 'Verfügbar', value: 'available' },
  { label: 'Reserviert', value: 'reserved' },
  { label: 'Verkauft', value: 'sold' },
  { label: 'Storniert', value: 'cancelled' },
]

// Control slideover open state
const slideoverOpen = computed({
  get: () => isOpen.value,
  set: (value) => {
    if (!value)
      close()
  },
})

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Helper to convert cents to Euro display
const formatCentsToEuro = (cents: string | null): string => {
  if (!cents)
    return ''
  const num = Number.parseInt(cents, 10)
  return Number.isNaN(num) ? '' : currencyFormatter.format(num / 100)
}

// Helper to convert Euro input to cents
const euroToCents = (euro: string): string => {
  if (!euro)
    return ''
  const num = Number.parseFloat(euro.replace(/[€\s.]/g, '').replace(',', '.'))
  return Number.isNaN(num) ? '' : Math.round(num * 100).toString()
}

// Local price state for display with two-way sync
const priceEuro = ref('')

watch(() => state.paidCents, (cents) => {
  priceEuro.value = formatCentsToEuro(cents)
}, { immediate: true })

watch(priceEuro, (euro) => {
  state.paidCents = euroToCents(euro) || null
})

// Handle member selection - populate owner fields from selected member
const onMemberSelect = (member: { id: string, firstName: string | null, lastName: string | null, email: string | null, phone: string | null } | null) => {
  if (!member)
    return
  state.ownerName = [member.firstName, member.lastName].filter(Boolean).join(' ') || null
  if (member.email)
    state.ownerEmail = member.email
  if (member.phone)
    state.ownerPhone = member.phone
}
</script>

<template>
  <USlideover
    v-model:open="slideoverOpen"
    title="Erlaubniskarte bearbeiten"
    :description="instanceData ? `Karte Nr. ${instanceData.permitNumber}` : ''"
    :dismissible="false"
  >
    <template #body>
      <div v-if="isInstanceLoading" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <UForm
        v-else
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- Status -->
        <UFormField label="Status" name="status" required>
          <USelect
            v-model="state.status"
            :items="statusOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <!-- Member Assignment -->
        <UFormField label="Mitglied" name="ownerMemberId">
          <ClubMemberSelect
            v-model="state.ownerMemberId"
            @select="onMemberSelect"
          />
        </UFormField>

        <!-- Owner Info (manual entry or auto-filled from member) -->
        <UFormField label="Inhaber Name" name="ownerName">
          <UInput
            v-model="state.ownerName"
            placeholder="Max Mustermann"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="E-Mail" name="ownerEmail">
            <UInput
              v-model="state.ownerEmail"
              type="email"
              placeholder="max@beispiel.de"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Telefon" name="ownerPhone">
            <UInput
              v-model="state.ownerPhone"
              type="tel"
              placeholder="+49 123 456789"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Payment Info -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Zahlungsreferenz" name="paymentReference">
            <UInput
              v-model="state.paymentReference"
              placeholder="z.B. Rechnung #123"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Bezahlt (€)" name="paidCents">
            <UInput
              v-model="priceEuro"
              placeholder="0,00"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Notes -->
        <UFormField label="Notizen" name="notes">
          <UTextarea
            v-model="state.notes"
            placeholder="Interne Notizen..."
            class="w-full"
            :rows="3"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="outline"
          @click="close"
        >
          Abbrechen
        </UButton>
        <UButton
          type="submit"
          :loading="isLoading"
          @click="submit"
        >
          Speichern
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
