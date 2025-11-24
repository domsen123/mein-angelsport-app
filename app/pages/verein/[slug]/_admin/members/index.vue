<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

const { getMembers } = useClub()

const { data } = getMembers()

const UBadge = resolveComponent('UBadge')

const columns: TableColumn<any>[] = [
  { accessorKey: 'firstName', header: 'Vorname' },
  { accessorKey: 'lastName', header: 'Nachname' },
  { accessorKey: 'email', header: 'E-Mail' },
  { accessorKey: 'roles', header: 'Gruppen', cell: ({ row }) => {
    const roles = row.original.roles.map(({ role}: { role: { id: string, name: string, isClubAdmin: boolean } }) => role)

    return h('div', {
      class: 'flex flex-wrap gap-1',
    }, {
      default: () => roles.map((role: { id: string, name: string, isClubAdmin: boolean }) =>
        h(UBadge, {
          key: role.id,
          color: role.isClubAdmin ? 'success' : 'info',
          variant: 'subtle',
        }, {
          default: () => role.name,
        }),
      ),
    })
  } },
]
</script>

<template>
  <div>
    <UTable :columns="columns" :data="data" />

    <pre class="text-xs" v-text="data" />
  </div>
</template>

<style></style>
