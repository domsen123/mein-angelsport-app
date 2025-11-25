<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type * as z from 'zod'
import { useCreatePermitOptionMutation } from '~/actions/permits/mutations'
import { permitFormSchema } from '~/composables/usePermitPageForm'

const { club } = useClub()
const clubSlug = computed(() => club.value?.slug || '')
const toast = useToast()

const {
  permitId,
  isEditMode,
  isCreateMode,
  state,
  permitData,
  waterOptions,
  isLoading,
  isPermitLoading,
  submit,
} = usePermitPageForm()

type Schema = z.output<typeof permitFormSchema>

const onSubmit = async (_event: FormSubmitEvent<Schema>) => {
  await submit()
}

// Page title
const pageTitle = computed(() => {
  if (isCreateMode.value)
    return 'Neuer Erlaubnisschein'
  if (permitData.value)
    return permitData.value.name
  return 'Erlaubnisschein bearbeiten'
})

const pageDescription = computed(() => {
  return isCreateMode.value
    ? 'Erstelle einen neuen Erlaubnisschein'
    : 'Bearbeite die Erlaubnisschein-Einstellungen'
})

// Option creation mutation (moved from PermitOptionsSection)
const createOptionMutation = useCreatePermitOptionMutation()

const handleAddOption = async () => {
  if (!club.value?.id || !permitId.value)
    return

  try {
    await createOptionMutation.mutateAsync({
      clubId: club.value.id,
      permitId: permitId.value,
    })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Die Option konnte nicht erstellt werden.'
    toast.add({
      title: 'Fehler beim Erstellen',
      description: message,
      color: 'error',
    })
  }
}

// Helper to toggle water selection
const toggleWater = (waterId: string, checked: boolean) => {
  if (checked) {
    state.selectedWaterIds = [...state.selectedWaterIds, waterId]
  }
  else {
    state.selectedWaterIds = state.selectedWaterIds.filter(id => id !== waterId)
  }
}
</script>

<template>
  <div v-if="isPermitLoading && isEditMode" class="flex items-center justify-center py-8">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
  </div>

  <UForm v-else id="permit-form" :schema="permitFormSchema" :state="state" class="lg:max-w-3xl" @submit="onSubmit">
    <UPageCard
      :title="pageTitle"
      :description="pageDescription"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="flex gap-2 w-fit lg:ms-auto">
        <UButton
          :to="`/verein/${clubSlug}/_admin/permits`"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
        >
          Zurück
        </UButton>
        <UButton
          form="permit-form"
          :label="isCreateMode ? 'Erstellen' : 'Speichern'"
          color="primary"
          type="submit"
          :loading="isLoading"
        />
      </div>
    </UPageCard>

    <!-- General Section -->
    <UPageCard
      title="Allgemein"
      description="Name des Erlaubnisscheins"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="z.B. Tageskarte, Jahreskarte..."
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.name" placeholder="z.B. Tageskarte, Jahreskarte..." class="w-full" />
      </UFormField>
    </UPageCard>

    <!-- Waters Section (edit mode only) -->
    <template v-if="isEditMode">
      <UPageCard
        title="Gewässer"
        description="Gewässer, für die dieser Erlaubnisschein gilt"
        variant="naked"
        orientation="horizontal"
        class="mt-8 mb-4"
      />
      <UPageCard variant="subtle">
        <div v-if="waterOptions.length === 0" class="text-sm text-muted">
          Keine Gewässer verfügbar. Bitte füge zuerst Gewässer zum Verein hinzu.
        </div>

        <template v-else>
          <UFormField
            v-for="water in waterOptions"
            :key="water.value"
            :label="water.name"
            :description="water.typeLabel"
            class="grid md:grid-cols-2 gap-4"
          >
            <div class="flex items-center justify-end">
              <USwitch
                :model-value="state.selectedWaterIds.includes(water.value)"
                @update:model-value="(checked: boolean) => toggleWater(water.value, checked)"
              />
            </div>
          </UFormField>
        </template>
      </UPageCard>
    </template>

    <!-- Options Section (edit mode only) -->
    <template v-if="isEditMode && club?.id && permitId && permitId !== 'new'">
      <UPageCard
        title="Optionen"
        description="Verschiedene Varianten und Preise für diesen Erlaubnisschein"
        variant="naked"
        orientation="horizontal"
        class="mt-8 mb-4"
      >
        <div class="flex gap-2 w-fit lg:ms-auto">
          <UButton
            icon="i-lucide-plus"
            variant="outline"
            :loading="createOptionMutation.isLoading.value"
            @click="handleAddOption"
          >
            Option hinzufügen
          </UButton>
        </div>
      </UPageCard>
      <PermitOptionsSection
        :club-id="club.id"
        :permit-id="permitId"
        :options="permitData?.options ?? []"
        :club-slug="clubSlug"
      />
    </template>
  </UForm>
</template>
