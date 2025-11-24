import type { Column } from '@tanstack/vue-table'
import type { Component, ConcreteComponent } from 'vue'
import { h } from 'vue'

/**
 * Creates a sortable table header button for TanStack Table columns.
 *
 * @param column - TanStack Table column instance
 * @param label - Display label for the header
 * @param UButton - Resolved UButton component (use resolveComponent('UButton') in your component)
 * @returns VNode for the sortable header button
 *
 * @example
 * ```ts
 * const UButton = resolveComponent('UButton')
 *
 * const columns: TableColumn<MyType>[] = [
 *   {
 *     accessorKey: 'name',
 *     header: ({ column }) => useSortableHeader(column, 'Name', UButton),
 *   },
 * ]
 * ```
 */
export function useSortableHeader<T>(
  column: Column<T>,
  label: string,
  UButton: Component | ConcreteComponent | string,
) {
  const isSorted = column.getIsSorted()

  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon: isSorted
      ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow')
      : 'i-lucide-arrow-up-down',
    class: '-mx-2.5',
    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
  })
}
