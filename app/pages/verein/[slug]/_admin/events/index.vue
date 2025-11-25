<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

const { club, getEventsPaginated } = useClub()
const { pagination, searchTerm, page, sorting } = usePagination()

const { data } = getEventsPaginated(pagination)

type EventItem = NonNullable<typeof data.value>['items'][number]

// Form composable for opening slideover
const { openCreate, openEdit } = useClubEventForm(computed(() => club.value?.id))

const UButton = resolveComponent('UButton')
const UIcon = resolveComponent('UIcon')

// Helper to format dates
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns: TableColumn<EventItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => useSortableHeader(column, 'Name', UButton),
  },
  {
    accessorKey: 'dateStart',
    header: ({ column }) => useSortableHeader(column, 'Startdatum', UButton),
    cell: ({ row }) => formatDate(row.original.dateStart),
  },
  {
    accessorKey: 'dateEnd',
    header: ({ column }) => useSortableHeader(column, 'Enddatum', UButton),
    cell: ({ row }) => formatDate(row.original.dateEnd),
  },
  {
    accessorKey: 'isWorkDuty',
    header: ({ column }) => useSortableHeader(column, 'Arbeitseinsatz', UButton),
    cell: ({ row }) => {
      return h(UIcon, {
        name: row.original.isWorkDuty ? 'i-lucide-check' : 'i-lucide-x',
        class: ['w-5 h-5', row.original.isWorkDuty ? 'text-green-500' : 'text-red-500'],
      })
    },
  },
  {
    accessorKey: 'isPublic',
    header: ({ column }) => useSortableHeader(column, 'Öffentlich', UButton),
    cell: ({ row }) => {
      return h(UIcon, {
        name: row.original.isPublic ? 'i-lucide-check' : 'i-lucide-x',
        class: ['w-5 h-5', row.original.isPublic ? 'text-green-500' : 'text-red-500'],
      })
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

function onRowClick(_e: Event, row: { original: EventItem }) {
  openEdit(row.original.id)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <UInput v-model="searchTerm" placeholder="Events suchen..." leading-icon="i-lucide-search" />
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Neues Event
      </UButton>
    </div>

    <UTable
      v-model:sorting="sorting"
      :columns="columns"
      :data="data?.items"
      :ui="{ tr: 'cursor-pointer hover:bg-elevated/50' }"
      @select="onRowClick"
    />

    <div class="flex justify-end">
      <UPagination v-model:page="page" :total="data?.meta.totalItems" />
    </div>

    <!-- Event Form Slideover -->
    <ClubEventFormSlideover />
  </div>
</template>
