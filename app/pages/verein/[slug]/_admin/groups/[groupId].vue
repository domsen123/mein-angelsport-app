<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type * as z from 'zod'
import { groupFormSchema } from '~/composables/useGroupPageForm'

const { club } = useClub()
const clubSlug = computed(() => club.value?.slug || '')

const {
  isEditMode,
  isCreateMode,
  state,
  roleData,
  isLoading,
  isRoleLoading,
  submit,
} = useGroupPageForm()

type Schema = z.output<typeof groupFormSchema>

const onSubmit = async (_event: FormSubmitEvent<Schema>) => {
  await submit()
}

// Page title
const pageTitle = computed(() => {
  if (isCreateMode.value)
    return 'Neue Gruppe'
  if (roleData.value)
    return roleData.value.name
  return 'Gruppe bearbeiten'
})

const pageDescription = computed(() => {
  return isCreateMode.value
    ? 'Füge eine neue Gruppe hinzu'
    : 'Bearbeite die Gruppeneinstellungen'
})
</script>

<template>
  <div v-if="isRoleLoading && isEditMode" class="flex items-center justify-center py-8">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
  </div>

  <UForm v-else id="group-form" :schema="groupFormSchema" :state="state" class="lg:max-w-3xl" @submit="onSubmit">
    <UPageCard
      :title="pageTitle"
      :description="pageDescription"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="flex gap-2 w-fit lg:ms-auto">
        <UButton
          :to="`/verein/${clubSlug}/_admin/groups`"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
        >
          Zurück
        </UButton>
        <UButton
          form="group-form"
          label="Speichern"
          color="primary"
          type="submit"
          :loading="isLoading"
        />
      </div>
    </UPageCard>

    <!-- Group Info -->
    <UPageCard
      title="Gruppeninformationen"
      description="Name und Beschreibung der Gruppe"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="Name der Gruppe"
        required
        class="grid md:grid-cols-2 gap-4"
      >
        <UInput v-model="state.name" placeholder="z.B. Vorstand" class="w-full" />
      </UFormField>
      <UFormField
        name="description"
        label="Beschreibung"
        description="Optionale Beschreibung der Gruppe"
        class="grid md:grid-cols-2 gap-4"
      >
        <UTextarea v-model="state.description" placeholder="Optionale Beschreibung der Gruppe" class="w-full" />
      </UFormField>
    </UPageCard>

    <!-- Permissions -->
    <UPageCard
      title="Berechtigungen"
      description="Rechte und Befreiungen für Mitglieder dieser Gruppe"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle">
      <UFormField
        name="isClubAdmin"
        label="Vereinsadministrator"
        description="Mitglieder dieser Gruppe können den Verein verwalten"
        class="grid md:grid-cols-2 gap-4"
      >
        <div class="flex items-center justify-end">
          <USwitch v-model="state.isClubAdmin" />
        </div>
      </UFormField>
      <UFormField
        name="isExemptFromWorkDuties"
        label="Von Arbeitsdiensten befreit"
        description="Mitglieder dieser Gruppe sind von Arbeitsdiensten befreit"
        class="grid md:grid-cols-2 gap-4"
      >
        <div class="flex items-center justify-end">
          <USwitch v-model="state.isExemptFromWorkDuties" />
        </div>
      </UFormField>
    </UPageCard>
  </UForm>
</template>
