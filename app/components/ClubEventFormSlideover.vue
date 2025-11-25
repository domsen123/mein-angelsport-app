<script lang="ts" setup>
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

const { club } = useClub()

const {
  isEditMode,
  isOpen,
  state,
  isLoading,
  isEventLoading,
  submit,
  close,
} = useClubEventForm(computed(() => club.value?.id))

const schema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name darf maximal 100 Zeichen lang sein'),
  description: z.string().max(500, 'Beschreibung darf maximal 500 Zeichen lang sein').nullable().optional().or(z.literal('')),
  content: z.string().nullable().optional().or(z.literal('')),
  dateStart: z.string().min(1, 'Startdatum ist erforderlich'),
  dateEnd: z.string().nullable().optional().or(z.literal('')),
  isWorkDuty: z.boolean(),
  isPublic: z.boolean(),
})

type Schema = z.output<typeof schema>

const formRef = ref<Form<Schema> | null>(null)

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  await submit()
}

async function handleSubmit() {
  await formRef.value?.submit()
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
    :title="isEditMode ? 'Event bearbeiten' : 'Neues Event'"
    :description="isEditMode ? 'Bearbeite die Eventeinstellungen' : 'Füge ein neues Event hinzu'"
  >
    <template #body>
      <div v-if="isEventLoading && isEditMode" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <UForm
        v-else
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" placeholder="z.B. Vereinsfest 2025" class="w-full" />
        </UFormField>

        <UFormField label="Beschreibung" name="description">
          <UTextarea v-model="state.description" placeholder="Kurze Beschreibung des Events" class="w-full" />
        </UFormField>

        <UFormField label="Inhalt" name="content">
          <UTextarea v-model="state.content" placeholder="Ausführliche Informationen zum Event" :rows="4" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Startdatum" name="dateStart" required>
            <UInput v-model="state.dateStart" type="datetime-local" class="w-full" />
          </UFormField>

          <UFormField label="Enddatum" name="dateEnd">
            <UInput v-model="state.dateEnd" type="datetime-local" class="w-full" />
          </UFormField>
        </div>

        <div>
          <label class="block text-sm font-medium text-highlighted mb-2">Einstellungen</label>
          <div class="space-y-3">
            <UCheckbox
              v-model="state.isWorkDuty"
              label="Arbeitseinsatz"
              description="Dieses Event ist ein Arbeitseinsatz"
            />

            <UCheckbox
              v-model="state.isPublic"
              label="Öffentlich"
              description="Dieses Event ist für alle sichtbar"
            />
          </div>
        </div>
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
          :loading="isLoading"
          @click="handleSubmit"
        >
          {{ isEditMode ? 'Speichern' : 'Erstellen' }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
