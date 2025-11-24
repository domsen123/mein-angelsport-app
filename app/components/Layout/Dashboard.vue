<script lang="ts" setup>
import type { DashboardNavbarProps } from '@nuxt/ui'

withDefaults(defineProps<{
  navbar?: DashboardNavbarProps
}>(), {
  breadcrumb: () => [],
  navbar: () => ({}),
})
const open = ref(false)
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <AppLogo :collapsed="collapsed" />
      </template>
      <template #default="{ collapsed }">
        <slot name="sidebar-default" :collapsed="collapsed" />
      </template>
      <template #footer="{ collapsed }">
        <AppUserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>
    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar v-bind="navbar">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<style></style>
