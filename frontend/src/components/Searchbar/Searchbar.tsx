// frontend/src/components/Searchbar/Searchbar.tsx
'use client';

import { FormEvent, useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchbarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onChange?: (query: string) => void;
  value?: string;
}

export function Searchbar({
  placeholder = 'Search…',
  onSearch,
  onChange,
  value = '',
}: SearchbarProps) {
  const [query, setQuery] = useState(value);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (onSearch) onSearch(query.trim());
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (onChange) onChange(newQuery.trim());
  }

  // Update internal state when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center h-12 w-full rounded-lg overflow-hidden bg-white border border-gray-200"
      role="search"
      aria-label="Search form"
    >
      <div className="flex-shrink-0 pl-3">
        <MagnifyingGlassIcon
          className="w-5 h-5 text-gray-400"
          aria-hidden="true"
        />
      </div>

      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none"
        aria-label="Search input"
      />
    </form>
  );
}
