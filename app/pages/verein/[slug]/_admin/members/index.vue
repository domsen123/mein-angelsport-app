<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

const { club, getMembers } = useClub()
const { pagination, searchTerm, page, sorting } = usePagination()

const { data } = getMembers(pagination)

type MemberItem = NonNullable<typeof data.value>['items'][number]

// Form composable for opening slideover
const { openCreate, openEdit } = useMemberForm(computed(() => club.value?.id))

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
    accessorKey: 'birthdate',
    header: 'Geburtsdatum',
    cell: ({ row }) => {
      const birthdate = row.original.birthdate
      return birthdate ? `${calculateAge(new Date(birthdate)).toString()} Jahre` : '-'
    },
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

function onRowClick(_e: Event, row: { original: MemberItem }) {
  openEdit(row.original.id)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <UInput v-model="searchTerm" placeholder="Mitglieder suchen..." leading-icon="i-lucide-search" />
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Neues Mitglied
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

    <!-- Member Form Slideover -->
    <MemberFormSlideover />
  </div>
</template>

<style></style>
