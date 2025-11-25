# Project Guidelines for Claude

## Paginated Queries (Server-Side)

Use `paginateQuery` helper for all paginated database queries:

```typescript
import { paginateQuery } from '~~/server/database/pagination'

const result = await paginateQuery(db, tableName, 'tableName', pagination, {
  searchableColumns: [table.column1, table.column2],
  sortableColumns: {
    fieldName: table.columnName,  // Maps API field to DB column
  },
  baseFilter: eq(table.foreignKey, id),
  with: { /* relations */ },
})
```

- **Sorting format**: `["field", "-field"]` where `-` prefix = descending
- Export response types: `export type ItemType = Awaited<ReturnType<typeof _getItems>>['items'][number]`

## Paginated Tables (Client-Side)

Use `usePagination` composable with `useSortableHeader`:

```typescript
const { pagination, searchTerm, page, sorting } = usePagination()
const UButton = resolveComponent('UButton')

const columns: TableColumn<ItemType>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => useSortableHeader(column, 'Label', UButton),
  },
  {
    accessorKey: 'nonSortable',
    header: 'Label',
    enableSorting: false,
  },
]
```

```vue
<UTable v-model:sorting="sorting" :columns="columns" :data="data?.items" />
```

- Sorting syncs to URL: `?orderBy=name,-createdAt`
- Derive item type from data: `type Item = NonNullable<typeof data.value>['items'][number]`

## Pinia-Colada Queries

```typescript
const { data, isLoading } = useQuery(queryOptions, () => ({ param: value.value }))
```

## Key Files

- `server/database/pagination.ts` - Generic pagination helper
- `server/utils/validation.ts` - `paginationSchema` with orderBy preprocessing
- `app/composables/usePagination.ts` - Client-side pagination + sorting state
- `app/composables/useSortableHeader.ts` - Sortable column header helper
- use class="w-full" on all NuxtUi input fields like (UInput, USelect, UTextarea...)

## Playwright MCP
- always first login at `http://localhost:3000/auth/login` with USER_MAIL and USER_PASSWORD from .env