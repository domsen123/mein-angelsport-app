<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

const { club, getWatersPaginated } = useClub()
const { pagination, searchTerm, page, sorting } = usePagination()
const { getWaterType } = useWater()

const { data } = getWatersPaginated(pagination)

type WaterItem = NonNullable<typeof data.value>['items'][number]

// Form composable for opening slideover
const { openCreate, openEdit } = useWaterForm(computed(() => club.value?.id))

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<WaterItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => useSortableHeader(column, 'Name', UButton),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => useSortableHeader(column, 'Typ', UButton),
    cell: ({ row }) => {
      const waterType = getWaterType(row.original.type)
      return h(UBadge, {
        color: waterType.value.color,
        variant: 'subtle',
      }, () => waterType.value.label)
    },
  },
  {
    accessorKey: 'postCode',
    header: ({ column }) => useSortableHeader(column, 'PLZ', UButton),
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

function onRowClick(_e: Event, row: { original: WaterItem }) {
  openEdit(row.original.id)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <UInput v-model="searchTerm" placeholder="Gewässer suchen..." leading-icon="i-lucide-search" />
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Neues Gewässer
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

    <!-- Water Form Slideover -->
    <WaterFormSlideover />
  </div>
</template>
