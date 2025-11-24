<script lang="ts" setup>
withDefaults(defineProps<{
  collapsed?: boolean
}>(), {
  collapsed: false,
})
</script>

<template>
  <NuxtLink class="text-lg" to="/">
    <template v-if="collapsed">
      <UIcon name="i-lucide-waves" :size="28" class="text-primary" />
    </template>
    <template v-else>
      <span class="font-bold">Mein Angelsport</span><span class="text-primary">.de</span>
    </template>
  </NuxtLink>
</template>

<style></style>
