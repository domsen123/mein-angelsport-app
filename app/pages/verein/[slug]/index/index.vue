<script lang="ts" setup>
const { club } = useClub()
</script>

<template>
  <div>
    <pre class="text-xs" v-text="{ club }" />
  </div>
</template>

<style></style>
