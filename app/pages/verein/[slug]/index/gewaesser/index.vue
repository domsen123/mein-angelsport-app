<script lang="ts" setup>
const { getWaters } = useClub()
const { getWaterType } = useWater()

const { data } = getWaters()
</script>

<template>
  <UPageBody>
    <UBlogPosts>
      <UBlogPost
        v-for="water in data"
        :key="water.id"
        :title="water.name"
        :description="water.postCode"
      >
        <template #header>
          <NuxtImg src="/img/lake.avif" class="w-full h-full object-cover object-center" />
        </template>
        <template #badge>
          <UBadge v-bind="getWaterType(water.type).value" variant="subtle" />
        </template>
      </UBlogPost>
    </UBlogPosts>
  </UPageBody>
</template>

<style></style>
