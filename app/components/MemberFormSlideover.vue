<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'
import * as z from 'zod'

const { club } = useClub()

const {
  memberId,
  isEditMode,
  isOpen,
  state,
  memberData,
  isLoading,
  isMemberLoading,
  submit,
  close,
} = useMemberForm(computed(() => club.value?.id))

const schema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich').max(30, 'Vorname darf maximal 30 Zeichen lang sein'),
  lastName: z.string().min(1, 'Nachname ist erforderlich').max(30, 'Nachname darf maximal 30 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse').nullable().optional().or(z.literal('')),
  phone: z.string().min(5, 'Telefonnummer muss mindestens 5 Zeichen haben').max(20).nullable().optional().or(z.literal('')),
  birthdate: z.custom<DateValue>().nullable().optional(),
  street: z.string().min(5, 'Straße muss mindestens 5 Zeichen haben').max(100).nullable().optional().or(z.literal('')),
  postalCode: z.string().min(4, 'PLZ muss mindestens 4 Zeichen haben').max(10).nullable().optional().or(z.literal('')),
  city: z.string().min(2, 'Stadt muss mindestens 2 Zeichen haben').max(50).nullable().optional().or(z.literal('')),
  country: z.string().min(2).max(50).nullable().optional(),
  preferredInvoicingMethod: z.enum(['email', 'postal_mail']).default('email'),
})

type Schema = z.output<typeof schema>

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  await submit()
}

// Local ref for UInputDate to avoid feedback loop during typing
const birthdateValue = ref<DateValue | undefined>()

// Helper to compare dates
function isSameDate(date: Date | null, calDate: DateValue | undefined): boolean {
  if (!date && !calDate) return true
  if (!date || !calDate) return false
  return date.getFullYear() === calDate.year
    && date.getMonth() + 1 === calDate.month
    && date.getDate() === calDate.day
}

// Sync from state to local ref when member data loads
watch(() => state.birthdate, (date) => {
  if (isSameDate(date, birthdateValue.value)) return
  if (date) {
    birthdateValue.value = new CalendarDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    )
  }
  else {
    birthdateValue.value = undefined
  }
}, { immediate: true })

// Sync from local ref to state when user changes date
watch(birthdateValue, (value) => {
  if (isSameDate(state.birthdate, value)) return
  if (value && value.year >= 1900) {
    state.birthdate = new Date(value.year, value.month - 1, value.day)
  }
  else if (!value) {
    state.birthdate = null
  }
})

// Form state with DateValue for birthdate (matches schema)
const formState = computed(() => ({
  ...state,
  birthdate: birthdateValue.value,
}))

const invoicingMethodOptions = [
  { label: 'E-Mail', value: 'email' },
  { label: 'Post', value: 'postal_mail' },
]

// Control slideover open state
const slideoverOpen = computed({
  get: () => isOpen.value,
  set: (value) => {
    if (!value)
      close()
  },
})
</script>

<template>
  <USlideover
    v-model:open="slideoverOpen"
    :title="isEditMode ? 'Mitglied bearbeiten' : 'Neues Mitglied'"
    :description="isEditMode ? 'Bearbeite die Mitgliedsdaten' : 'Füge ein neues Mitglied hinzu'"
  >
    <template #body>
      <div v-if="isMemberLoading && isEditMode" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <UForm
        v-else
        :schema="schema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- Personal Data -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Vorname" name="firstName" required>
            <UInput v-model="state.firstName" placeholder="Max" />
          </UFormField>

          <UFormField label="Nachname" name="lastName" required>
            <UInput v-model="state.lastName" placeholder="Mustermann" />
          </UFormField>
        </div>

        <UFormField label="Geburtsdatum" name="birthdate">
          <UInputDate v-model="birthdateValue" />
        </UFormField>

        <!-- Contact -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="E-Mail" name="email">
            <UInput v-model="state.email" type="email" placeholder="max@beispiel.de" />
          </UFormField>

          <UFormField label="Telefon" name="phone">
            <UInput v-model="state.phone" type="tel" placeholder="+49 123 456789" />
          </UFormField>
        </div>

        <!-- Address -->
        <UFormField label="Straße" name="street">
          <UInput v-model="state.street" placeholder="Musterstraße 123" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="PLZ" name="postalCode">
            <UInput v-model="state.postalCode" placeholder="12345" />
          </UFormField>

          <UFormField label="Stadt" name="city">
            <UInput v-model="state.city" placeholder="Musterstadt" />
          </UFormField>
        </div>

        <UFormField label="Land" name="country">
          <UInput v-model="state.country" placeholder="Germany" />
        </UFormField>

        <!-- Preferences -->
        <UFormField label="Bevorzugte Rechnungsart" name="preferredInvoicingMethod">
          <URadioGroup
            v-model="state.preferredInvoicingMethod"
            :items="invoicingMethodOptions"
            orientation="horizontal"
          />
        </UFormField>

        <!-- Role Management Section (edit mode only) -->
        <MemberRolesSection
          v-if="isEditMode && memberId && memberId !== 'new' && club?.id && memberData?.roles"
          :club-id="club.id"
          :member-id="memberId"
          :member-roles="memberData.roles"
        />
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
          {{ isEditMode ? 'Speichern' : 'Erstellen' }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
