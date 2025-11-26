<script lang="ts" setup>
interface MemberSelectProps {
  modelValue: string | string[] | null | undefined
  multiple?: boolean
  onlyWithAccount?: boolean
}

const props = defineProps<MemberSelectProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | undefined]
}>()

// Convert null to undefined for internal use
const internalValue = computed({
  get: () => props.modelValue ?? undefined,
  set: value => emit('update:modelValue', value),
})

const { getMembers } = useClub()

const searchTerm = ref('')
const searchTermDebounced = useDebounce(searchTerm, 300)

const { data } = getMembers(computed(() => ({
  page: 1,
  pageSize: 99,
  searchTerm: searchTermDebounced.value || undefined,
  orderBy: ['firstName'],
  onlyWithAccount: props.onlyWithAccount || undefined,
})))

const items = computed(() => (data.value?.items || []).map(m => ({
  label: [m.firstName, m.lastName].filter(Boolean).join(' ') || 'Unbekannt',
  value: m.id,
})))
</script>

<template>
  <USelectMenu
    v-model:search-term="searchTerm"
    v-model="internalValue"
    :items="items"
    value-key="value"
    label-key="label"
    :multiple="multiple"
  />
</template>

<style></style>
