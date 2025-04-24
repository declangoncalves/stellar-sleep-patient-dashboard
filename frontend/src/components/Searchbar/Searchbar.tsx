// frontend/src/components/SearchBar.tsx
'use client';

import { FormEvent, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchbarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function Searchbar({
  placeholder = 'Search appointment, patient or etc…',
  onSearch,
}: SearchbarProps) {
  const [query, setQuery] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (onSearch) onSearch(query.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center h-16 w-full bg-nonerounded-lg overflow-hidden"
    >
      <div className="flex-shrink-0 pl-3">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
      </div>

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none"
      />

      <button
        type="submit"
        className="text-blue-400 border-blue-200 border-2 rounded-full hover:bg-blue-100 px-4 py-2"
      >
        Search
      </button>
    </form>
  );
}
