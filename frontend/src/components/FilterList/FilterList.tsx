'use client';

interface FilterListProps {
  statusValue: string;
  onStatusChange: (value: string) => void;
  cityValue: string;
  onCityChange: (value: string) => void;
  stateValue: string;
  onStateChange: (value: string) => void;
}

export function FilterList({
  statusValue,
  onStatusChange,
  cityValue,
  onCityChange,
  stateValue,
  onStateChange,
}: FilterListProps) {
  return (
    <div className="w-64 bg-white pr-10">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Status
          </label>
          <select
            id="status"
            value={statusValue}
            onChange={e => onStatusChange(e.target.value)}
            className="w-full p-2 border rounded-md text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="inquiry">Inquiry</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="churned">Churned</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            City
          </label>
          <input
            type="text"
            id="city"
            value={cityValue}
            onChange={e => onCityChange(e.target.value)}
            placeholder="Filter by city"
            className="w-full p-2 border rounded-md text-gray-700"
          />
        </div>

        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            State
          </label>
          <input
            type="text"
            id="state"
            value={stateValue}
            onChange={e => onStateChange(e.target.value)}
            placeholder="Filter by state"
            className="w-full p-2 border rounded-md text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}
