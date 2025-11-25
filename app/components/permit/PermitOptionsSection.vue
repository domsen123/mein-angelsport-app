<script lang="ts" setup>
import type { PermitOption } from '~/types/permit'
import { useCreatePermitOptionMutation } from '~/actions/permits/mutations'

const props = defineProps<{
  clubId: string
  permitId: string
  options: PermitOption[]
}>()

const toast = useToast()
const createOptionMutation = useCreatePermitOptionMutation()

async function handleAddOption() {
  try {
    await createOptionMutation.mutateAsync({
      clubId: props.clubId,
      permitId: props.permitId,
    })
  }
  catch (error: any) {
    toast.add({
      title: 'Fehler beim Erstellen',
      description: error?.message || 'Die Option konnte nicht erstellt werden.',
      color: 'error',
    })
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">
          Optionen
        </h2>
        <UButton
          icon="i-lucide-plus"
          size="sm"
          variant="outline"
          aria-label="Neue Option hinzufügen"
          :loading="createOptionMutation.isLoading.value"
          :disabled="createOptionMutation.isLoading.value"
          @click="handleAddOption"
        >
          Option hinzufügen
        </UButton>
      </div>
    </template>

    <div v-if="options.length === 0" class="py-8 text-center text-muted">
      <p>Noch keine Optionen vorhanden.</p>
      <p class="text-sm">
        Füge Optionen hinzu um verschiedene Varianten (z.B. Mitglied/Gastangler) anzubieten.
      </p>
    </div>

    <div v-else class="space-y-4">
      <PermitOptionItem
        v-for="option in options"
        :key="option.id"
        :club-id="clubId"
        :permit-id="permitId"
        :option="option"
      />
    </div>
  </UCard>
</template>
