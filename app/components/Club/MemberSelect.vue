<script lang="ts" setup generic="T extends boolean">
interface MemberSelectProps {
  modelValue: T extends true ? string[] | undefined : string | undefined
  multiple?: T
}

const props = defineProps<MemberSelectProps>()
const emit = defineEmits(['update:modelValue'])

const { modelValue } = useVModels(props, emit)

const { getMembers } = useClub()

const searchTerm = ref('')
const searchTermDebounced = useDebounce(searchTerm, 300)

const { data } = getMembers(computed(() => ({
  page: 1,
  pageSize: 99,
  searchTerm: searchTermDebounced.value || undefined,
  orderBy: ['firstName'],
})))

const items = computed(() => (data.value?.items || []).map(m => ({
  label: [m.firstName, m.lastName].filter(Boolean).join(' ') || 'Unbekannt',
  value: m.id,
})))
</script>

<template>
  <USelectMenu
    v-model:search-term="searchTerm"
    v-model="modelValue"
    :items="items" value-key="value" label-key="label"
    :multiple="multiple"
  />
</template>

<style></style>
