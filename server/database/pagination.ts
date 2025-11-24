import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations, SQL } from 'drizzle-orm'
import type { PgColumn, PgTable, TableConfig } from 'drizzle-orm/pg-core'
import type { PaginationParams } from '~~/server/utils/validation'
import type { DatabaseClient } from './client'
import type * as schema from './schema'
import { asc, desc } from 'drizzle-orm'
import { buildSearchFilter } from './helper'

// Extract the schema type for relations
type Schema = typeof schema
type TSchema = ExtractTablesWithRelations<Schema>

// Table names from schema that can be queried
type TableNames = keyof TSchema & string

// Query config type for a specific table
type QueryConfig<TTableName extends TableNames> = DBQueryConfig<
  'many',
  true,
  TSchema,
  TSchema[TTableName]
>

// Result type for a query with relations
type QueryResult<
  TTableName extends TableNames,
  TWith extends QueryConfig<TTableName>['with'],
> = BuildQueryResult<TSchema, TSchema[TTableName], { with: TWith }>

/**
 * Configuration for paginated queries
 */
export interface PaginationConfig<
  TTableName extends TableNames,
  TWith extends QueryConfig<TTableName>['with'] = undefined,
> {
  /** Columns to search against using ILIKE */
  searchableColumns?: PgColumn[]
  /** Map of field names to columns that can be sorted. Keys are the API field names, values are the actual columns */
  sortableColumns?: Record<string, PgColumn>
  /** Additional WHERE filter to apply */
  baseFilter?: SQL
  /** Relations to include in the query */
  with?: TWith
}

/**
 * Result structure for paginated queries
 */
export interface PaginatedResult<TItem> {
  meta: {
    totalItems: number
    page: number
    pageSize: number
  }
  items: TItem[]
}

/**
 * Parse orderBy strings like ["name", "-createdAt"] into drizzle orderBy clauses.
 * Prefix with "-" for descending order.
 *
 * @param orderByStrings - Array of field names, optionally prefixed with "-" for DESC
 * @param sortableColumns - Map of allowed field names to their column references
 * @returns Array of SQL order clauses
 */
function parseSortOrder(
  orderByStrings: string[] | undefined,
  sortableColumns: Record<string, PgColumn>,
): SQL[] {
  if (!orderByStrings?.length)
    return []

  return orderByStrings
    .map((str) => {
      const isDescending = str.startsWith('-')
      const field = isDescending ? str.slice(1) : str
      const column = sortableColumns[field]

      if (!column) {
        console.warn(`[paginateQuery] Invalid sort field ignored: ${field}`)
        return null
      }

      return isDescending ? desc(column) : asc(column)
    })
    .filter((x): x is SQL => x !== null)
}

/**
 * Generic paginated query helper for Drizzle ORM.
 *
 * @param db - Database client
 * @param table - The Drizzle table reference (for counting)
 * @param tableName - The table name as a key of the schema (for query API)
 * @param pagination - Pagination parameters (page, pageSize, searchTerm, orderBy)
 * @param config - Configuration for search, sort, filter, and relations
 * @returns Paginated result with items and metadata
 *
 * @example
 * ```ts
 * const result = await paginateQuery(
 *   db,
 *   clubRole,
 *   'clubRole',
 *   pagination,
 *   {
 *     searchableColumns: [clubRole.name],
 *     sortableColumns: { name: clubRole.name, createdAt: clubRole.createdAt },
 *     baseFilter: eq(clubRole.clubId, clubId),
 *     with: { members: { columns: { memberId: true } } },
 *   }
 * )
 * ```
 */
export async function paginateQuery<
  TTable extends PgTable<TableConfig>,
  TTableName extends TableNames,
  TWith extends QueryConfig<TTableName>['with'] = undefined,
>(
  db: DatabaseClient,
  table: TTable,
  tableName: TTableName,
  pagination: PaginationParams,
  config: PaginationConfig<TTableName, TWith> = {},
): Promise<PaginatedResult<QueryResult<TTableName, TWith>>> {
  const {
    searchableColumns,
    sortableColumns = {},
    baseFilter,
    with: withRelations,
  } = config
  // const tableName = getTableName(table) as TTableName

  // Build search filter from searchTerm
  const searchFilter = searchableColumns?.length
    ? buildSearchFilter(pagination.searchTerm, searchableColumns)
    : undefined

  // Combine base filter with search filter using AND
  let whereClause: SQL | undefined
  if (baseFilter && searchFilter) {
    // Import and here to avoid circular dependency issues
    const { and } = await import('drizzle-orm')
    whereClause = and(baseFilter, searchFilter)
  }
  else {
    whereClause = baseFilter ?? searchFilter
  }

  // Parse sorting from orderBy strings
  const orderByClause = parseSortOrder(pagination.orderBy, sortableColumns)

  // Build query options
  const queryOptions: QueryConfig<TTableName> = {
    where: whereClause,
    offset: pagination.pageSize * (pagination.page - 1),
    limit: pagination.pageSize,
  }

  if (orderByClause.length > 0) {
    queryOptions.orderBy = orderByClause
  }

  if (withRelations) {
    queryOptions.with = withRelations
  }

  // Execute query and count in parallel for better performance
  const [items, totalItems] = await Promise.all([
    db.query[tableName].findMany(queryOptions) as Promise<QueryResult<TTableName, TWith>[]>,
    db.$count(table, whereClause),
  ])

  return {
    meta: {
      totalItems,
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
    items,
  }
}
