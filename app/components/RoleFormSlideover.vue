<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

const { club } = useClub()

const {
  isEditMode,
  isOpen,
  state,
  isLoading,
  isRoleLoading,
  submit,
  close,
} = useRoleForm(computed(() => club.value?.id))

const schema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(40, 'Name darf maximal 40 Zeichen lang sein'),
  description: z.string().max(200, 'Beschreibung darf maximal 200 Zeichen lang sein').nullable().optional().or(z.literal('')),
  isClubAdmin: z.boolean(),
  isExemptFromWorkDuties: z.boolean(),
})

type Schema = z.output<typeof schema>

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  await submit()
}

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
    :title="isEditMode ? 'Gruppe bearbeiten' : 'Neue Gruppe'"
    :description="isEditMode ? 'Bearbeite die Gruppeneinstellungen' : 'Füge eine neue Gruppe hinzu'"
  >
    <template #body>
      <div v-if="isRoleLoading && isEditMode" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <UForm
        v-else
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" placeholder="z.B. Vorstand" class="w-full" />
        </UFormField>

        <UFormField label="Beschreibung" name="description">
          <UTextarea v-model="state.description" placeholder="Optionale Beschreibung der Gruppe" class="w-full" />
        </UFormField>

        <UFormField label="Berechtigungen" name="permissions">
          <div class="space-y-3">
            <UCheckbox
              v-model="state.isClubAdmin"
              label="Vereinsadministrator"
              description="Mitglieder dieser Gruppe können den Verein verwalten"
            />

            <UCheckbox
              v-model="state.isExemptFromWorkDuties"
              label="Von Arbeitsdiensten befreit"
              description="Mitglieder dieser Gruppe sind von Arbeitsdiensten befreit"
            />
          </div>
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
          {{ isEditMode ? 'Speichern' : 'Erstellen' }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
