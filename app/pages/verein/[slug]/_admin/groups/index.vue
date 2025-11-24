<script lang="ts" setup>
const { getRoles } = useClub()

const { data } = getRoles()
</script>

<template>
  <div>
    <pre class="text-xs" v-text="data" />
  </div>
</template>

<style></style>
