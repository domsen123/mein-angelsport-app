<script lang="ts" setup>
import { waterFormSchema } from '~/composables/useWaterPageForm'

const { club } = useClub()
const clubSlug = computed(() => club.value?.slug || '')

const {
  isEditMode,
  isCreateMode,
  state,
  waterData,
  isLoading,
  isWaterLoading,
  submit,
} = useWaterPageForm()

const onSubmit = () => submit()

// Page title
const pageTitle = computed(() => {
  if (isCreateMode.value)
    return 'Neues Gewässer'
  if (waterData.value)
    return waterData.value.name
  return 'Gewässer bearbeiten'
})

const pageDescription = computed(() => {
  return isCreateMode.value
    ? 'Füge ein neues Gewässer hinzu'
    : 'Bearbeite die Gewässerdetails'
})

const waterTypeOptions = [
  { label: 'Stillgewässer', value: 'lentic' },
  { label: 'Fließgewässer', value: 'lotic' },
]
</script>

<template>
  <div v-if="isWaterLoading && isEditMode" class="flex items-center justify-center py-8">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    <span class="sr-only">Laden...</span>
  </div>

  <UForm v-else id="water-form" :schema="waterFormSchema" :state="state" class="lg:max-w-3xl" @submit="onSubmit">
    <UPageCard
      :title="pageTitle"
      :description="pageDescription"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="flex gap-2 w-fit lg:ms-auto">
        <UButton
          :to="`/verein/${clubSlug}/_admin/waters`"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
        >
          Zurück
        </UButton>
        <UButton
          form="water-form"
          label="Speichern"
          color="primary"
          type="submit"
          :loading="isLoading"
        />
      </div>
    </UPageCard>

    <!-- Water Info -->
    <UPageCard
      title="Gewässerinformationen"
      description="Name, Typ und Standort des Gewässers"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="Name des Gewässers"
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.name" placeholder="z.B. Waldteich" class="w-full" />
      </UFormField>
      <UFormField
        name="type"
        label="Gewässertyp"
        description="Art des Gewässers"
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <USelect
          v-model="state.type"
          :items="waterTypeOptions"
          value-key="value"
          class="w-full"
        />
      </UFormField>
      <UFormField
        name="postCode"
        label="Postleitzahl"
        description="Postleitzahl des Gewässerstandorts"
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.postCode" placeholder="z.B. 12345" class="w-full" />
      </UFormField>
    </UPageCard>
  </UForm>
</template>
