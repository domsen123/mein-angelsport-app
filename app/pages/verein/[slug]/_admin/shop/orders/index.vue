<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { OrderListItem } from '~~/server/actions/shop-admin/get-orders'
import { useOrdersQuery } from '~/actions/shop-admin/queries'

const { club } = useClub()
const { pagination, searchTerm, page, sorting } = usePagination()

const clubId = computed(() => club.value?.id)
const clubSlug = computed(() => club.value?.slug || '')

// Filters
const statusFilter = ref<string | undefined>(undefined)
const yearFilter = ref<number | undefined>(new Date().getFullYear())

const statusOptions = [
  { label: 'Alle Status', value: undefined },
  { label: 'Ausstehend', value: 'PENDING' },
  { label: 'Bezahlt', value: 'PAID' },
  { label: 'Abgeschlossen', value: 'FULFILLED' },
  { label: 'Storniert', value: 'CANCELLED' },
]

const currentYear = new Date().getFullYear()
const yearOptions = [
  { label: 'Alle Jahre', value: undefined },
  ...Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - i),
    value: currentYear - i,
  })),
]

const { data } = useQuery(useOrdersQuery, () => ({
  clubId: clubId.value!,
  pagination: pagination.value,
  status: statusFilter.value as 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED' | undefined,
  year: yearFilter.value,
}))

type OrderItem = OrderListItem

const openDetail = (id: string) => navigateTo(`/verein/${clubSlug.value}/_admin/shop/orders/${id}`)

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)

const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'PAID': return 'info'
    case 'FULFILLED': return 'success'
    case 'CANCELLED': return 'error'
    default: return 'neutral'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Ausstehend'
    case 'PAID': return 'Bezahlt'
    case 'FULFILLED': return 'Abgeschlossen'
    case 'CANCELLED': return 'Storniert'
    default: return status
  }
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<OrderItem>[] = [
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => useSortableHeader(column, 'Bestellnr.', UButton),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => useSortableHeader(column, 'Datum', UButton),
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: 'member',
    header: 'Empfänger',
    enableSorting: false,
    cell: ({ row }) => {
      const member = row.original.member
      return member ? `${member.firstName} ${member.lastName}` : '-'
    },
  },
  {
    id: 'buyer',
    header: 'Käufer',
    enableSorting: false,
    cell: ({ row }) => {
      const buyer = row.original.buyer
      const member = row.original.member
      if (!buyer)
        return '-'
      if (buyer.id === member?.id)
        return 'Selbst'
      return `${buyer.firstName} ${buyer.lastName}`
    },
  },
  {
    accessorKey: 'totalCents',
    header: ({ column }) => useSortableHeader(column, 'Summe', UButton),
    cell: ({ row }) => formatPrice(row.original.totalCents),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => useSortableHeader(column, 'Status', UButton),
    cell: ({ row }) => {
      return h(UBadge, {
        color: getStatusColor(row.original.status),
        variant: 'subtle',
      }, () => getStatusLabel(row.original.status))
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h(UButton, {
        icon: 'i-lucide-eye',
        size: 'xs',
        color: 'neutral',
        variant: 'ghost',
        onClick: (e: Event) => {
          e.stopPropagation()
          openDetail(row.original.id)
        },
      })
    },
  },
]

const onRowClick = (_e: Event, row: { original: OrderItem }) => {
  openDetail(row.original.id)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-4 justify-between items-center">
      <div class="flex gap-2 flex-wrap">
        <UInput
          v-model="searchTerm"
          placeholder="Bestellnummer suchen..."
          leading-icon="i-lucide-search"
          class="w-48"
        />
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          placeholder="Status"
          class="w-40"
        />
        <USelect
          v-model="yearFilter"
          :items="yearOptions"
          placeholder="Jahr"
          class="w-32"
        />
      </div>
    </div>

    <UTable
      v-model:sorting="sorting"
      :columns="columns"
      :data="data?.items"
      :ui="{ tr: 'cursor-pointer hover:bg-elevated/50' }"
      @select="onRowClick"
    />

    <div class="flex">
      <div />
      <div class="ml-auto">
        <UPagination v-model:page="page" :total="data?.meta.totalItems" />
      </div>
    </div>
  </div>
</template>
