<script lang="ts" setup>
const { getEvents } = useClub()

const { data } = getEvents()
</script>

<template>
  <UPageBody>
    <UBlogPosts>
      <UBlogPost
        v-for="event in data"
        :key="event.id"
        :title="event.name"
        :excerpt="event.description"
        :date="new Date(event.dateStart)"
      >
        <template #header>
          <NuxtImg src="/img/ax.avif" class="w-full h-full object-cover object-center" />
        </template>
      </UBlogPost>
    </UBlogPosts>
  </UPageBody>
</template>

<style></style>
