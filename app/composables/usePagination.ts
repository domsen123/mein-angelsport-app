import type { SortingState } from '@tanstack/vue-table'
import type { PaginationParams } from '~~/server/utils/validation'

export interface ClientPaginationParams {
  page: Ref<number>
  pageSize: Ref<number>
  searchTerm: Ref<string>
  sorting: Ref<SortingState>
  pagination: ComputedRef<PaginationParams>
}

export const usePagination = (): ClientPaginationParams => {
  const page = useRouteQuery('page', '1', { transform: Number, mode: 'push' })
  const pageSize = useRouteQuery('pageSize', '10', { transform: Number, mode: 'push' })
  const searchTerm = ref<string>('')

  const debouncedSearchTerm = ref(searchTerm.value)
  const routerSearchTerm = useRouteQuery<string>('searchTerm', '', { mode: 'push' })

  // Sorting state synced with URL
  const routerOrderBy = useRouteQuery<string>('orderBy', '', { mode: 'push' })

  // Convert URL string to SortingState on init
  const sorting = ref<SortingState>(
    routerOrderBy.value
      ? routerOrderBy.value.split(',').filter(Boolean).map(s => ({
          id: s.startsWith('-') ? s.slice(1) : s,
          desc: s.startsWith('-'),
        }))
      : [],
  )

  // Convert SortingState to server format ["field", "-field"]
  const orderBy = computed(() =>
    sorting.value.map(s => s.desc ? `-${s.id}` : s.id),
  )

  // Sync sorting changes to URL
  watch(sorting, (newSorting) => {
    routerOrderBy.value = newSorting
      .map(s => s.desc ? `-${s.id}` : s.id)
      .join(',') || ''
  }, { deep: true })

  const pagination = computed<PaginationParams>(() => ({
    page: page.value,
    pageSize: pageSize.value,
    searchTerm: debouncedSearchTerm.value || undefined,
    orderBy: orderBy.value,
  }))

  debouncedWatch(searchTerm, () => {
    page.value = 1
    debouncedSearchTerm.value = searchTerm.value
    routerSearchTerm.value = searchTerm.value
  }, { debounce: 300 })

  return {
    page,
    pageSize,
    searchTerm,
    sorting,
    pagination,
  }
}
