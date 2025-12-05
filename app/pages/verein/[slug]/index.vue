<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const { club, clubSlug, isLoading, isClubMember, isClubAdmin } = useClub()
const { setNavigation } = useMobileNavigation()

const navigation = computed<NavigationMenuItem[][]>(() => [
  [
    { type: 'label' as const, label: 'Verein' },
    { icon: 'i-lucide-home', label: 'Übersicht', to: `/verein/${clubSlug.value}`, exact: true },
    { icon: 'i-lucide-calendar', label: 'Termine', to: `/verein/${clubSlug.value}/termine` },
    { icon: 'i-lucide-waves', label: 'Gewässer', to: `/verein/${clubSlug.value}/gewaesser` },
  ],
  isClubMember.value
    ? [
        { type: 'label' as const, label: 'Mitgliederbereich' },
        { icon: 'i-lucide-shopping-cart', label: 'Shop', to: `/verein/${clubSlug.value}/shop` },
      ]
    : [],
  isClubAdmin.value
    ? [
        { type: 'label' as const, label: 'Administration' },
        { icon: 'i-lucide-settings', label: 'Einstellungen', to: `/verein/${clubSlug.value}/_admin` },
      ]
    : [],
])

watch(navigation, (val) => setNavigation(val), { immediate: true })
</script>

<template>
  <UPage>
    <UPageHeader>
      <template #title>
        <USkeleton v-if="isLoading" class="h-6 w-95" />
        <template v-else-if="club">
          <span class="hidden md:inline-block">{{ club.name }}</span>
          <span class="inline-block md:hidden">{{ club.shortName }}</span>
        </template>
      </template>
    </UPageHeader>
    <UPage>
      <template #left>
        <UPageAside>
          <UNavigationMenu
            orientation="vertical"
            :items="navigation"
          />
        </UPageAside>
      </template>
      <NuxtPage />
    </UPage>
  </UPage>
</template>

<style></style>
