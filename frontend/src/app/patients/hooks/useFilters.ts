import { useState, useEffect } from 'react';

interface FilterState {
  status: string;
  city: string;
  state: string;
  search: string;
}

interface UseFiltersReturn {
  filters: FilterState;
  debouncedFilters: FilterState;
  setStatus: (value: string) => void;
  setCity: (value: string) => void;
  setState: (value: string) => void;
  setSearch: (value: string) => void;
  clearAll: () => void;
}

export function useFilters(debounceDelay = 600): UseFiltersReturn {
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    city: '',
    state: '',
    search: '',
  });

  const [debouncedFilters, setDebouncedFilters] =
    useState<FilterState>(filters);

  // Only debounce city, state, and search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(prev => ({
        ...prev,
        city: filters.city,
        state: filters.state,
        search: filters.search,
      }));
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [filters.city, filters.state, filters.search, debounceDelay]);

  // Update status immediately in both filters and debouncedFilters
  const setStatus = (value: string) => {
    setFilters(prev => ({ ...prev, status: value }));
    setDebouncedFilters(prev => ({ ...prev, status: value }));
  };

  const setCity = (value: string) =>
    setFilters(prev => ({ ...prev, city: value }));
  const setState = (value: string) =>
    setFilters(prev => ({ ...prev, state: value }));
  const setSearch = (value: string) =>
    setFilters(prev => ({ ...prev, search: value }));

  const clearAll = () => {
    const emptyState = { status: '', city: '', state: '', search: '' };
    setFilters(emptyState);
    setDebouncedFilters(emptyState);
  };

  return {
    filters,
    debouncedFilters,
    setStatus,
    setCity,
    setState,
    setSearch,
    clearAll,
  };
}
