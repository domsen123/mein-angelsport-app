<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

const { getMembers } = useClub()
const { pagination, searchTerm, page, sorting } = usePagination()

const { data } = getMembers(pagination)

type MemberItem = NonNullable<typeof data.value>['items'][number]

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<MemberItem>[] = [
  {
    accessorKey: 'firstName',
    header: ({ column }) => useSortableHeader(column, 'Vorname', UButton),
  },
  {
    accessorKey: 'lastName',
    header: ({ column }) => useSortableHeader(column, 'Nachname', UButton),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => useSortableHeader(column, 'E-Mail', UButton),
  },
  {
    accessorKey: 'roles',
    header: 'Gruppen',
    enableSorting: false,
    cell: ({ row }) => {
      const roles = row.original.roles.map(({ role }) => role)

      return h('div', {
        class: 'flex flex-wrap gap-1',
      }, {
        default: () => roles.map(role =>
          h(UBadge, {
            key: role.id,
            color: role.isClubAdmin ? 'success' : 'info',
            variant: 'subtle',
          }, {
            default: () => role.name,
          }),
        ),
      })
    },
  },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex">
      <div>
        <UInput v-model="searchTerm" placeholder="Mitglieder suchen..." leading-icon="i-lucide-search" />
      </div>
    </div>

    <UTable
      v-model:sorting="sorting"
      :columns="columns"
      :data="data?.items"
    />

    <div class="flex">
      <div></div>
      <div class="ml-auto">
        <UPagination v-model:page="page" :total="data?.meta.totalItems" />
      </div>
    </div>
  </div>
</template>

<style></style>
