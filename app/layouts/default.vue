<script lang="ts" setup>
const authStore = useAuthStore()
const { currentUser } = storeToRefs(authStore)

const { navigation } = useMobileNavigation()
</script>

<template>
  <div class="relative">
    <UHeader>
      <template #left>
        <NuxtLink class="text-lg" to="/">
          <span class="font-bold">Mein Angelsport</span><span class="text-primary">.de</span>
        </NuxtLink>
      </template>
      <template #right>
        <template v-if="currentUser">
        </template>
        <template v-else>
          <UButton label="Registrieren" variant="ghost" to="/auth/register" />
          <UButton label="Anmelden" variant="subtle" to="/auth/login" />
        </template>
      </template>
      <template #body>
        <UNavigationMenu :items="navigation" orientation="vertical" />
      </template>
    </UHeader>
    <UMain>
      <UContainer>
        <slot />
      </UContainer>
    </UMain>
    <UFooter />
  </div>
</template>
