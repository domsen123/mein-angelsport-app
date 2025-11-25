<script lang="ts" setup>
import type { PermitOption } from '~/types/permit'

defineProps<{
  clubId: string
  permitId: string
  options: PermitOption[]
  clubSlug: string
}>()
</script>

<template>
  <UPageCard v-if="options.length === 0" variant="subtle">
    <div class="py-8 text-center text-muted">
      <p>Noch keine Optionen vorhanden.</p>
      <p class="text-sm">
        Füge Optionen hinzu um verschiedene Varianten (z.B. Mitglied/Gastangler) anzubieten.
      </p>
    </div>
  </UPageCard>

  <div v-else class="space-y-4">
    <PermitOptionItem
      v-for="option in options"
      :key="option.id"
      :club-id="clubId"
      :permit-id="permitId"
      :option="option"
      :club-slug="clubSlug"
    />
  </div>
</template>
