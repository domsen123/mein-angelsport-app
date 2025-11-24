<script lang="ts" setup>
const { getMembers } = useClub()

const { data } = getMembers()
</script>

<template>
  <div>
    <pre class="text-xs" v-text="data" />
  </div>
</template>

<style></style>
