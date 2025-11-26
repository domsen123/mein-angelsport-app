<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { ShopItemListItem } from '~~/server/actions/shop-admin/get-shop-items'
import { useDeleteShopItemMutation } from '~/actions/shop-admin/mutations'
import { useShopItemsQuery } from '~/actions/shop-admin/queries'

const { club } = useClub()
const { pagination, searchTerm, page, sorting } = usePagination()
const toast = useToast()

const clubId = computed(() => club.value?.id)
const clubSlug = computed(() => club.value?.slug || '')

const { data, refetch } = useQuery(useShopItemsQuery, () => ({
  clubId: clubId.value!,
  pagination: pagination.value,
}))

type ShopItem = ShopItemListItem

const deleteMutation = useDeleteShopItemMutation()

// Delete confirmation modal state
const deleteModalOpen = ref(false)
const itemToDelete = ref<ShopItem | null>(null)

const openCreate = () => navigateTo(`/verein/${clubSlug.value}/_admin/shop/items/new`)
const openEdit = (id: string) => navigateTo(`/verein/${clubSlug.value}/_admin/shop/items/${id}`)

const openDeleteModal = (item: ShopItem) => {
  itemToDelete.value = item
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!clubId.value || !itemToDelete.value)
    return

  try {
    await deleteMutation.mutateAsync({
      clubId: clubId.value,
      itemId: itemToDelete.value.id,
    })
    toast.add({
      title: 'Artikel gelöscht',
      description: `${itemToDelete.value.name} wurde erfolgreich gelöscht.`,
      color: 'success',
    })
    refetch()
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.'
    toast.add({
      title: 'Fehler',
      description: message,
      color: 'error',
    })
  }
  finally {
    deleteModalOpen.value = false
    itemToDelete.value = null
  }
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<ShopItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => useSortableHeader(column, 'Name', UButton),
  },
  {
    accessorKey: 'priceCents',
    header: ({ column }) => useSortableHeader(column, 'Preis', UButton),
    cell: ({ row }) => formatPrice(row.original.priceCents),
  },
  {
    accessorKey: 'autoAddOnPermitPurchase',
    header: 'Auto-Hinzufügen',
    enableSorting: false,
    cell: ({ row }) => {
      if (row.original.autoAddOnPermitPurchase) {
        return h(UBadge, { color: 'info', variant: 'subtle' }, () => 'Ja')
      }
      return h(UBadge, { color: 'neutral', variant: 'subtle' }, () => 'Nein')
    },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => useSortableHeader(column, 'Status', UButton),
    cell: ({ row }) => {
      if (row.original.isActive) {
        return h(UBadge, { color: 'success', variant: 'subtle' }, () => 'Aktiv')
      }
      return h(UBadge, { color: 'neutral', variant: 'subtle' }, () => 'Inaktiv')
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h('div', { class: 'flex gap-1' }, [
        h(UButton, {
          icon: 'i-lucide-pencil',
          size: 'xs',
          color: 'neutral',
          variant: 'ghost',
          onClick: (e: Event) => {
            e.stopPropagation()
            openEdit(row.original.id)
          },
        }),
        h(UButton, {
          icon: 'i-lucide-trash-2',
          size: 'xs',
          color: 'error',
          variant: 'ghost',
          onClick: (e: Event) => {
            e.stopPropagation()
            openDeleteModal(row.original)
          },
        }),
      ])
    },
  },
]

const onRowClick = (_e: Event, row: { original: ShopItem }) => {
  openEdit(row.original.id)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <UInput v-model="searchTerm" placeholder="Artikel suchen..." leading-icon="i-lucide-search" class="w-full" />
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Neuer Artikel
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
      <div />
      <div class="ml-auto">
        <UPagination v-model:page="page" :total="data?.meta.totalItems" />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="deleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-trash-2" class="size-5 text-error" />
              <h3 class="font-semibold">
                Artikel löschen
              </h3>
            </div>
          </template>
          <p>
            Möchten Sie <strong>{{ itemToDelete?.name }}</strong> wirklich löschen?
          </p>
          <p class="text-sm text-muted mt-2">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="neutral" variant="outline" @click="deleteModalOpen = false">
                Abbrechen
              </UButton>
              <UButton color="error" :loading="deleteMutation.isLoading.value" @click="confirmDelete">
                Löschen
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
