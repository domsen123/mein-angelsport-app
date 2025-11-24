<script lang="ts" setup>
const authStore = useAuthStore()
const { currentUser } = storeToRefs(authStore)
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
          <AppUserMenu class="max-w-44" />
        </template>
        <template v-else>
          <UButton label="Registrieren" variant="ghost" to="/auth/sign-up" />
          <UButton label="Anmelden" variant="subtle" to="/auth/sign-in" />
        </template>
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
