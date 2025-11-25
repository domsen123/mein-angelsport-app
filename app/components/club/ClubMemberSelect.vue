<script lang="ts" setup>
import { refDebounced } from '@vueuse/core'

const props = defineProps<{
  modelValue: string | null
  placeholder?: string
  allowNone?: boolean
  noneLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'select': [member: { id: string, firstName: string | null, lastName: string | null, email: string | null, phone: string | null } | null]
}>()

const NONE_VALUE = '__none__'

const searchTerm = ref('')
const searchTermDebounced = refDebounced(searchTerm, 300)

const { getMembers } = useClub()
const membersQuery = getMembers(computed(() => ({
  page: 1,
  pageSize: 99,
  searchTerm: searchTermDebounced.value || undefined,
})))

const noneLabelText = computed(() => props.noneLabel || 'Kein Mitglied')

const memberOptions = computed(() =>
  [
    { label: noneLabelText.value, value: NONE_VALUE, member: null, email: '' },
    ...(membersQuery.data.value?.items || []).map(m => ({
      label: [m.firstName, m.lastName].filter(Boolean).join(' ') || 'Unbekannt',
      email: m.email,
      value: m.id,
      member: m,
    })),
  ],
)

const internalValue = computed({
  get: () => props.modelValue ?? NONE_VALUE,
  set: (value) => {
    const isNone = value === NONE_VALUE
    emit('update:modelValue', isNone ? null : value)
    emit('select', isNone ? null : memberOptions.value.find(o => o.value === value)?.member ?? null)
  },
})

const selectedOption = computed(() =>
  internalValue.value === NONE_VALUE
    ? { label: noneLabelText.value, value: NONE_VALUE }
    : memberOptions.value.find(o => o.value === internalValue.value),
)
</script>

<template>
  <USelectMenu
    v-model="internalValue"
    v-model:search-term="searchTerm"
    :items="memberOptions"
    :loading="membersQuery.isLoading.value"
    value-key="value"
    label-key="label"
    :placeholder="placeholder || 'Mitglied auswählen...'"
    ignore-filter
    class="w-full"
  >
    <template #default>
      <span :class="selectedOption ? 'truncate' : 'text-muted truncate'">
        {{ selectedOption?.label || placeholder || 'Mitglied auswählen...' }}
      </span>
    </template>

    <template #item-label="{ item }">
      {{ item.label }}
      <span v-if="item.email" class="text-muted ml-1">
        {{ item.email }}
      </span>
    </template>
  </USelectMenu>
</template>
