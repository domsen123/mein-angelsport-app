<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import { usePermitInstancesByPeriodIdQuery } from '~/actions/permits/queries'

const route = useRoute()
const { club, isLoading: isClubLoading } = useClub()

// Get route params
const permitId = computed(() => route.params.permitId as string)
const periodId = computed(() => route.params.periodId as string)

// We need to fetch the option ID from the period - for now, use route query or find it
// Actually, the instances API requires optionId, so we need to get it from somewhere
// Let's use a route query param for optionId
const optionId = computed(() => route.query.optionId as string)

const { pagination, searchTerm, page, sorting } = usePagination()

// Fetch instances
const { data, isLoading: isQueryLoading } = useQuery(
  usePermitInstancesByPeriodIdQuery,
  () => ({
    clubId: club.value!.id,
    permitId: permitId.value,
    optionId: optionId.value,
    periodId: periodId.value,
    pagination: pagination.value,
  }),
)

// Combined loading state: show loading while club or query is loading
const isLoading = computed(() => isClubLoading.value || isQueryLoading.value)

type InstanceItem = NonNullable<typeof data.value>['items'][number]

// Form composable for opening slideover
const { openEdit } = usePermitInstanceForm({
  clubId: computed(() => club.value?.id),
  permitId,
  optionId,
  periodId,
})

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

// Status badge colors
function getStatusColor(status: string): 'success' | 'warning' | 'info' | 'error' | 'neutral' {
  switch (status) {
    case 'available': return 'success'
    case 'reserved': return 'warning'
    case 'sold': return 'info'
    case 'cancelled': return 'error'
    default: return 'neutral'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'available': return 'Verfügbar'
    case 'reserved': return 'Reserviert'
    case 'sold': return 'Verkauft'
    case 'cancelled': return 'Storniert'
    default: return status
  }
}

const columns: TableColumn<InstanceItem>[] = [
  {
    accessorKey: 'permitNumber',
    header: ({ column }) => useSortableHeader(column, 'Nr.', UButton),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => useSortableHeader(column, 'Status', UButton),
    cell: ({ row }) => {
      const status = row.original.status
      return h(UBadge, {
        color: getStatusColor(status),
        variant: 'subtle',
      }, {
        default: () => getStatusLabel(status),
      })
    },
  },
  {
    accessorKey: 'ownerName',
    header: ({ column }) => useSortableHeader(column, 'Inhaber', UButton),
    cell: ({ row }) => {
      const instance = row.original
      // Show member name if linked, otherwise owner name
      if (instance.ownerMember) {
        return `${instance.ownerMember.firstName} ${instance.ownerMember.lastName}`
      }
      return instance.ownerName || '-'
    },
  },
  {
    accessorKey: 'ownerEmail',
    header: 'E-Mail',
    enableSorting: false,
    cell: ({ row }) => row.original.ownerEmail || '-',
  },
  {
    accessorKey: 'soldAt',
    header: ({ column }) => useSortableHeader(column, 'Verkauft am', UButton),
    cell: ({ row }) => {
      const soldAt = row.original.soldAt
      if (!soldAt) return '-'
      return new Date(soldAt).toLocaleDateString('de-DE')
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

function onRowClick(_e: Event, row: { original: InstanceItem }) {
  openEdit(row.original.id)
}

// Stats from API (counts all instances in period, not just current page)
const stats = computed(() => data.value?.stats ?? null)
</script>

<template>
  <div class="space-y-4">
    <!-- Header with back link -->
    <div class="flex items-center gap-4">
      <UButton
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        :to="`/verein/${route.params.slug}/_admin/permits/${permitId}`"
      />
      <h2 class="text-xl font-semibold">
        Erlaubniskarten verwalten
      </h2>
    </div>

    <!-- Stats -->
    <div v-if="stats" class="flex gap-4 text-sm">
      <span class="text-muted-foreground">Gesamt: {{ stats.total }}</span>
      <UBadge color="success" variant="subtle">
        {{ stats.available }} verfügbar
      </UBadge>
      <UBadge color="warning" variant="subtle">
        {{ stats.reserved }} reserviert
      </UBadge>
      <UBadge color="info" variant="subtle">
        {{ stats.sold }} verkauft
      </UBadge>
      <UBadge color="error" variant="subtle">
        {{ stats.cancelled }} storniert
      </UBadge>
    </div>

    <!-- Search -->
    <div class="flex justify-between items-center">
      <div>
        <UInput
          v-model="searchTerm"
          placeholder="Karten suchen..."
          leading-icon="i-lucide-search"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading || !club" class="flex items-center justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    </div>

    <!-- Table -->
    <UTable
      v-else
      v-model:sorting="sorting"
      :columns="columns"
      :data="data?.items"
      :ui="{ tr: 'cursor-pointer hover:bg-elevated/50' }"
      @select="onRowClick"
    />

    <!-- Pagination -->
    <div class="flex">
      <div />
      <div class="ml-auto">
        <UPagination v-model:page="page" :total="data?.meta.totalItems" />
      </div>
    </div>

    <!-- Instance Form Slideover -->
    <PermitInstanceFormSlideover
      v-if="club?.id && optionId"
      :club-id="club.id"
      :permit-id="permitId"
      :option-id="optionId"
      :period-id="periodId"
    />
  </div>
</template>
