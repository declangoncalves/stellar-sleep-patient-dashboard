import { useRef, useEffect } from 'react';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';

interface FiltersPanelProps {
  isOpen: boolean;
  statusValue: string;
  onStatusChange: (value: string) => void;
  cityValue: string;
  onCityChange: (value: string) => void;
  stateValue: string;
  onStateChange: (value: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  onClose: () => void;
}

export function FiltersPanel({
  isOpen,
  statusValue,
  onStatusChange,
  cityValue,
  onCityChange,
  stateValue,
  onStateChange,
  onClearAll,
  hasActiveFilters,
  onClose,
}: FiltersPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-gray-200 shadow-lg z-50"
    >
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={statusValue}
            onChange={e => onStatusChange(e.target.value)}
            className="w-full p-2 border rounded text-black"
          >
            <option value="">All Statuses</option>
            <option value="inquiry">Inquiry</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="churned">Churned</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <Input
            type="text"
            value={cityValue}
            onChange={e => onCityChange(e.target.value)}
            placeholder="Filter by city"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <Input
            type="text"
            value={stateValue}
            onChange={e => onStateChange(e.target.value)}
            placeholder="Filter by state"
          />
        </div>
      </div>
      {hasActiveFilters && (
        <div className="text-red-300 pb-4">
          <Button
            variant="ghost"
            onClick={onClearAll}
            className="w-full text-red-400 font-bold"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
