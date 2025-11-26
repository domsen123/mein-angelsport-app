<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

const { clubSlug, getPermits } = useClub()
const { pagination, searchTerm, page, sorting } = usePagination()

const { data } = getPermits(pagination)

type PermitItem = NonNullable<typeof data.value>['items'][number]

const UButton = resolveComponent('UButton')

const columns: TableColumn<PermitItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => useSortableHeader(column, 'Name', UButton),
  },
  {
    accessorKey: 'watersCount',
    header: 'Gewässer',
    enableSorting: false,
    cell: ({ row }) => row.original.watersCount,
  },
  {
    accessorKey: 'optionsCount',
    header: 'Optionen',
    enableSorting: false,
    cell: ({ row }) => row.original.optionsCount,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => useSortableHeader(column, 'Erstellt', UButton),
    cell: ({ row }) => {
      const createdAt = row.original.createdAt
      return createdAt ? new Date(createdAt).toLocaleDateString('de-DE') : '-'
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h(UButton, {
        icon: 'i-lucide-pencil',
        size: 'xs',
        color: 'neutral',
        variant: 'ghost',
        onClick: (e: Event) => {
          e.stopPropagation()
          navigateToPermit(row.original.id)
        },
      })
    },
  },
]

function navigateToPermit(permitId: string) {
  navigateTo(`/verein/${clubSlug.value}/_admin/permits/${permitId}`)
}

function onRowClick(_e: Event, row: { original: PermitItem }) {
  navigateToPermit(row.original.id)
}

function createNewPermit() {
  navigateTo(`/verein/${clubSlug.value}/_admin/permits/new`)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <UInput v-model="searchTerm" class="w-full" placeholder="Erlaubnisscheine suchen..." leading-icon="i-lucide-search" />
      </div>
      <UButton icon="i-lucide-plus" @click="createNewPermit">
        Neuer Erlaubnisschein
      </UButton>
    </div>

    <UTable
      v-model:sorting="sorting"
      :columns="columns"
      :data="data?.items"
      :ui="{ tr: 'cursor-pointer hover:bg-elevated/50' }"
      @select="onRowClick"
    />

    <div class="flex">
      <div></div>
      <div class="ml-auto">
        <UPagination v-model:page="page" :total="data?.meta.totalItems" />
      </div>
    </div>
  </div>
</template>
