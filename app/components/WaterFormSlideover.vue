<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

const { club } = useClub()

const {
  isEditMode,
  isOpen,
  state,
  isLoading,
  isWaterLoading,
  submit,
  close,
} = useWaterForm(computed(() => club.value?.id))

const schema = z.object({
  type: z.enum(['lotic', 'lentic']),
  name: z.string().min(1, 'Gewässername ist erforderlich').max(100, 'Name darf maximal 100 Zeichen lang sein'),
  postCode: z.string().min(1, 'Postleitzahl ist erforderlich').max(10, 'Postleitzahl darf maximal 10 Zeichen lang sein'),
})

type Schema = z.output<typeof schema>

const waterTypeOptions = [
  { label: 'Stillgewässer', value: 'lentic' },
  { label: 'Fließgewässer', value: 'lotic' },
]

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
    :title="isEditMode ? 'Gewässer bearbeiten' : 'Neues Gewässer'"
    :description="isEditMode ? 'Bearbeite die Gewässerdetails' : 'Füge ein neues Gewässer hinzu'"
  >
    <template #body>
      <div v-if="isWaterLoading && isEditMode" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <UForm
        v-else
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Gewässername" name="name" required>
          <UInput v-model="state.name" placeholder="z.B. Waldteich" class="w-full" />
        </UFormField>

        <UFormField label="Gewässertyp" name="type" required>
          <USelect
            v-model="state.type"
            :items="waterTypeOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Postleitzahl" name="postCode" required>
          <UInput v-model="state.postCode" placeholder="z.B. 12345" class="w-full" />
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
