import { useMemo, useState } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { ListQuery } from '@/types'

export function useListQuery<T extends ListQuery>(defaults: T) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [filters, setFilters] = useState(defaults)

  const query = useMemo(
    () => ({ ...filters, search: search === '' ? '' : debouncedSearch }),
    [filters, search, debouncedSearch],
  )

  function reset() {
    setSearch('')
    setFilters(defaults)
  }

  function sort(column: string) {
    setFilters((current) => ({
      ...current,
      page: 1,
      sortBy: column,
      sortDir: current.sortBy === column && current.sortDir === 'asc' ? 'desc' : 'asc',
    }))
  }

  function setPage(page: number) {
    setFilters((current) => ({ ...current, page }))
  }

  return { search, setSearch, filters, setFilters, query, reset, sort, setPage }
}
