<script lang="ts" setup>
const { club } = useClub()
definePageMeta({
  redirect: (to) => {
    const slug = to.params.slug as string
    return `/verein/${slug}/shop`
  },
})
</script>

<template>
  <div>
    <pre class="text-xs" v-text="{ club }" />
  </div>
</template>

<style></style>
