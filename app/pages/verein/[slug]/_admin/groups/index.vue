<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

const { getRoles } = useClub()
const { pagination, searchTerm, page } = usePagination()

const { data } = getRoles(pagination)

const UIcon = resolveComponent('UIcon')

const columns: TableColumn<any>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Beschreibung' },
  { accessorKey: 'isClubAdmin', header: 'Admin', cell: ({ row }) => {
    return h(UIcon, {
      name: row.original.isExemptFromWorkDuties ? 'i-lucide-check' : 'i-lucide-cross',
      class: ['w-5 h-5', row.original.isExemptFromWorkDuties ? 'text-green-500' : 'text-red-500'],
    })
  } },
  { accessorKey: 'isExemptFromWorkDuties', header: 'Von Arbeitsdiensten befreit', cell: ({ row }) => {
    return h(UIcon, {
      name: row.original.isExemptFromWorkDuties ? 'i-lucide-check' : 'i-lucide-cross',
      class: ['w-5 h-5', row.original.isExemptFromWorkDuties ? 'text-green-500' : 'text-red-500'],
    })
  } },
  { accessorKey: 'memberCount', header: 'Anzahl Mitglieder', cell: ({ row }) => {
    return row.original.memberCount ?? 0
  } },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex">
      <div>
        <UInput v-model="searchTerm" placeholder="Gruppen suchen..." leading-icon="i-lucide-search" />
      </div>
    </div>
    <UTable :columns="columns" :data="data?.items" />

    <div class="flex">
      <div></div>
      <div class="ml-auto">
        <UPagination v-model:page="page" :total="data?.meta.totalItems" />
      </div>
    </div>
  </div>
</template>

<style></style>
