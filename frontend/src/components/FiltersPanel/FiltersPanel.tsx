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
        <Input
          label="Status"
          value={statusValue}
          onChange={e => onStatusChange(e.target.value)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'inquiry', label: 'Inquiry' },
            { value: 'onboarding', label: 'Onboarding' },
            { value: 'active', label: 'Active' },
            { value: 'churned', label: 'Churned' },
          ]}
        />
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
        {hasActiveFilters && (
          <div className="text-red-300 pt-2">
            <Button variant="danger" className="w-full" onClick={onClearAll}>
              Clear All
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
