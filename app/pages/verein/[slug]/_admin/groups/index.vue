<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

const { club, getRoles } = useClub()
const { pagination, searchTerm, page, sorting } = usePagination()

const { data } = getRoles(pagination)

type RoleItem = NonNullable<typeof data.value>['items'][number]

// Form composable for opening slideover
const { openCreate, openEdit } = useRoleForm(computed(() => club.value?.id))

const UButton = resolveComponent('UButton')
const UIcon = resolveComponent('UIcon')

const columns: TableColumn<RoleItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => useSortableHeader(column, 'Name', UButton),
  },
  {
    accessorKey: 'description',
    header: 'Beschreibung',
    enableSorting: false,
  },
  {
    accessorKey: 'isClubAdmin',
    header: ({ column }) => useSortableHeader(column, 'Admin', UButton),
    cell: ({ row }) => {
      return h(UIcon, {
        name: row.original.isClubAdmin ? 'i-lucide-check' : 'i-lucide-x',
        class: ['w-5 h-5', row.original.isClubAdmin ? 'text-green-500' : 'text-red-500'],
      })
    },
  },
  {
    accessorKey: 'isExemptFromWorkDuties',
    header: 'Von Arbeitsdiensten befreit',
    enableSorting: false,
    cell: ({ row }) => {
      return h(UIcon, {
        name: row.original.isExemptFromWorkDuties ? 'i-lucide-check' : 'i-lucide-x',
        class: ['w-5 h-5', row.original.isExemptFromWorkDuties ? 'text-green-500' : 'text-red-500'],
      })
    },
  },
  {
    accessorKey: 'memberCount',
    header: 'Anzahl Mitglieder',
    enableSorting: false,
    cell: ({ row }) => {
      return row.original.memberCount ?? 0
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
          openEdit(row.original.id)
        },
      })
    },
  },
]

function onRowClick(_e: Event, row: { original: RoleItem }) {
  openEdit(row.original.id)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <UInput v-model="searchTerm" placeholder="Gruppen suchen..." leading-icon="i-lucide-search" />
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Neue Gruppe
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

    <!-- Role Form Slideover -->
    <RoleFormSlideover />
  </div>
</template>
