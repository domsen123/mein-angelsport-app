<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import type { FormSubmitEvent } from '@nuxt/ui'
import type * as z from 'zod'
import { CalendarDate } from '@internationalized/date'
import { memberFormSchema } from '~/composables/useMemberPageForm'

const { club } = useClub()
const clubSlug = computed(() => club.value?.slug || '')

const {
  memberId,
  isEditMode,
  isCreateMode,
  state,
  memberData,
  isLoading,
  isMemberLoading,
  submit,
} = useMemberPageForm()

type Schema = z.output<typeof memberFormSchema>

const onSubmit = async (_event: FormSubmitEvent<Schema>) => {
  await submit()
}

// Local ref for UInputDate to avoid feedback loop during typing
const birthdateValue = ref<DateValue | undefined>()

// Helper to compare dates
const isSameDate = (date: Date | null, calDate: DateValue | undefined): boolean => {
  if (!date && !calDate)
    return true
  if (!date || !calDate)
    return false
  return date.getFullYear() === calDate.year
    && date.getMonth() + 1 === calDate.month
    && date.getDate() === calDate.day
}

// Sync from state to local ref when member data loads
watch(() => state.birthdate, (date) => {
  if (isSameDate(date, birthdateValue.value))
    return
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
  if (isSameDate(state.birthdate, value))
    return
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

// Page title
const pageTitle = computed(() => {
  if (isCreateMode.value)
    return 'Neues Mitglied'
  if (memberData.value)
    return `${memberData.value.firstName} ${memberData.value.lastName}`
  return 'Mitglied bearbeiten'
})

const pageDescription = computed(() => {
  return isCreateMode.value
    ? 'Füge ein neues Mitglied hinzu'
    : 'Bearbeite die Mitgliedsdaten'
})
</script>

<template>
  <div v-if="isMemberLoading && isEditMode" class="flex items-center justify-center py-8">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
  </div>

  <UForm v-else id="member-form" :schema="memberFormSchema" :state="formState" class="lg:max-w-3xl" @submit="onSubmit">
    <UPageCard
      :title="pageTitle"
      :description="pageDescription"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="flex gap-2 w-fit lg:ms-auto">
        <UButton
          :to="`/verein/${clubSlug}/_admin/members`"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
        >
          Zurück
        </UButton>
        <UButton
          form="member-form"
          label="Speichern"
          color="primary"
          type="submit"
          :loading="isLoading"
        />
      </div>
    </UPageCard>

    <!-- Personal Data -->
    <UPageCard
      title="Persönliche Daten"
      description="Name und Geburtsdatum"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="firstName"
        label="Vorname"
        description="Vorname des Mitglieds"
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.firstName" placeholder="Max" class="w-full" />
      </UFormField>
      <UFormField
        name="lastName"
        label="Nachname"
        description="Nachname des Mitglieds"
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.lastName" placeholder="Mustermann" class="w-full" />
      </UFormField>
      <UFormField
        name="birthdate"
        label="Geburtsdatum"
        description="Geburtsdatum des Mitglieds"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInputDate v-model="birthdateValue" class="w-full" />
      </UFormField>
    </UPageCard>

    <!-- Contact -->
    <UPageCard
      title="Kontakt"
      description="E-Mail und Telefon"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="email"
        label="E-Mail"
        description="E-Mail-Adresse des Mitglieds"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.email" type="email" placeholder="max@beispiel.de" class="w-full" />
      </UFormField>
      <UFormField
        name="phone"
        label="Telefon"
        description="Telefonnummer des Mitglieds"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.phone" type="tel" placeholder="+49 123 456789" class="w-full" />
      </UFormField>
    </UPageCard>

    <!-- Address -->
    <UPageCard
      title="Adresse"
      description="Anschrift des Mitglieds"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="street"
        label="Straße"
        description="Straße und Hausnummer"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.street" placeholder="Musterstraße 123" class="w-full" />
      </UFormField>
      <UFormField
        name="postalCode"
        label="PLZ"
        description="Postleitzahl"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.postalCode" placeholder="12345" class="w-full" />
      </UFormField>
      <UFormField
        name="city"
        label="Stadt"
        description="Stadt oder Ort"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.city" placeholder="Musterstadt" class="w-full" />
      </UFormField>
      <UFormField
        name="country"
        label="Land"
        description="Land"
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.country" placeholder="Germany" class="w-full" />
      </UFormField>
    </UPageCard>

    <!-- Preferences -->
    <UPageCard
      title="Einstellungen"
      description="Präferenzen für das Mitglied"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="preferredInvoicingMethod"
        label="Bevorzugte Rechnungsart"
        description="Wie soll das Mitglied Rechnungen erhalten?"
        class="grid md:grid-cols-2 gap-4"
      >
        <URadioGroup
          v-model="state.preferredInvoicingMethod"
          :items="invoicingMethodOptions"
          orientation="horizontal"
        />
      </UFormField>
    </UPageCard>

    <!-- Managed By -->
    <UPageCard
      title="Verwaltung"
      description="Mitglied, das dieses Mitglied verwaltet"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="managedBy"
        label="Verwaltet von"
        description="Wähle ein Mitglied mit Account, das dieses Mitglied verwaltet (z.B. Elternteil)"
        class="grid md:grid-cols-2 gap-4"
      >
        <ClubMemberSelect v-model="state.managedBy" class="w-full" />
      </UFormField>
    </UPageCard>

    <!-- Roles Section (edit mode only) -->
    <template v-if="isEditMode && memberId && memberId !== 'new' && club?.id && memberData?.roles">
      <UPageCard
        title="Gruppen / Rollen"
        description="Zugewiesene Gruppen und Rollen"
        variant="naked"
        orientation="horizontal"
        class="mt-8 mb-4"
      />
      <UPageCard variant="subtle">
        <MemberRolesSection
          :club-id="club.id"
          :member-id="memberId"
          :member-roles="memberData.roles"
          :show-accordion="false"
        />
      </UPageCard>
    </template>
  </UForm>
</template>
