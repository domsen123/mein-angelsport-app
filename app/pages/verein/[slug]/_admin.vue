<script lang="ts" setup>
definePageMeta({
  layout: 'blank',
})

const { clubSlug } = useClub()
</script>

<template>
  <LayoutDashboard>
    <template #sidebar-default="{ collapsed }">
      <UButton variant="ghost" :label="collapsed ? undefined : 'Zurück zum Verein'" icon="i-lucide-arrow-left" :square="collapsed" :to="`/verein/${clubSlug}`" />
      <UNavigationMenu
        orientation="vertical"
        :items="[
          [
            { type: 'label', label: 'Verein', class: [collapsed && 'hidden'] },
            { icon: 'i-lucide-settings', label: 'Einstellungen', to: `/verein/${clubSlug}/_admin`, exact: true },
          ],
          [
            { type: 'label', label: 'Mitglieder', class: [collapsed && 'hidden'] },
            { icon: 'i-lucide-user', label: 'Mitglieder', to: `/verein/${clubSlug}/_admin/members` },
            { icon: 'i-lucide-users', label: 'Gruppen', to: `/verein/${clubSlug}/_admin/groups` },
          ],
          [
            { type: 'label', label: 'Rechtliches', class: [collapsed && 'hidden'] },
            { icon: 'i-lucide-book-open-check', label: 'Erlaubnisscheine', to: `/verein/${clubSlug}/_admin/permits` },
          ],
          // [
          //   { type: 'label', label: 'Reports', class: [collapsed && 'hidden'] },
          //   { icon: 'i-lucide-axe', label: 'Arbeitseinsätze', to: toClubRoute('/settings/reports').value },
          // ],
        ]"
      />
    </template>
    <NuxtPage />
  </LayoutDashboard>
</template>

<style></style>
