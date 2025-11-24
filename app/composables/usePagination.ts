import type { PaginationParams } from '~~/server/utils/validation'

export interface ClientPaginationParams {
  page: Ref<number>
  pageSize: Ref<number>
  searchTerm: Ref<string>
  pagination: ComputedRef<PaginationParams>
}

export const usePagination = (): ClientPaginationParams => {
  const page = useRouteQuery('page', '1', { transform: Number, mode: 'push' })
  const pageSize = useRouteQuery('pageSize', '10', { transform: Number, mode: 'push' })
  const searchTerm = ref<string>('')

  const debouncedSearchTerm = ref(searchTerm.value)
  const routerSearchTerm = useRouteQuery<string>('searchTerm', '', { mode: 'push' })

  const pagination = computed<PaginationParams>(() => {
    return {
      page: page.value,
      pageSize: pageSize.value,
      searchTerm: debouncedSearchTerm.value || undefined,
      orderBy: [],
    }
  })

  debouncedWatch(searchTerm, () => {
    page.value = 1
    debouncedSearchTerm.value = searchTerm.value
    routerSearchTerm.value = searchTerm.value
  }, { debounce: 300 })

  return {
    page,
    pageSize,
    searchTerm,
    pagination,
  }
}
