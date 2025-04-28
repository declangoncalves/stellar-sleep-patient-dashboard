'use client';

import { useState, useEffect, memo, useMemo, useCallback, useRef } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from 'react-query';
import { CustomField, CustomFieldValue } from '@/lib/types';
import { customFieldsApi, utils } from '@/lib/api';

// Create a simple debounce function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Props {
  patientId: number;
  customFieldValues?: CustomFieldValue[];
  onUpdate: (updatedValues: CustomFieldValue[]) => void;
}

// Inner component that uses react-query hooks
function AdditionalPatientInfoInner({
  patientId,
  customFieldValues = [],
  onUpdate,
}: Props) {
  // Store previous values for comparison
  const prevCustomFieldValuesRef =
    useRef<CustomFieldValue[]>(customFieldValues);

  // Helper function to convert custom field values to a record
  const getValuesRecord = useCallback(
    (fields: CustomFieldValue[]) =>
      Object.fromEntries(fields.map(v => [v.field_definition, v.value || ''])),
    [],
  );

  // Prevent re-initialization on every render
  const initialValues = useRef<Record<number, string>>(
    getValuesRecord(customFieldValues),
  );

  // Local state for field values
  const [values, setValues] = useState<Record<number, string>>(
    initialValues.current,
  );

  // Track if values were updated locally
  const locallyUpdated = useRef(false);

  // Track if we've sent an update to parent
  const updateSentRef = useRef(false);

  // Debounce the values to avoid too many updates
  const debouncedValues = useDebounce(values, 300);

  // Query for custom fields
  const {
    data: customFields = [],
    isLoading,
    error,
  } = useQuery('customFields', customFieldsApi.fetchCustomFields, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // For mutations
  const queryClient = useQueryClient();

  // Mutation for adding new fields
  const addFieldMutation = useMutation(customFieldsApi.createCustomField, {
    onSuccess: newField => {
      queryClient.setQueryData<CustomField[]>('customFields', (prev = []) => [
        ...prev,
        newField,
      ]);

      // Initialize empty value
      setValues(prev => ({ ...prev, [newField.id]: '' }));
      locallyUpdated.current = true;
    },
  });

  // Keep values in sync with props, but only if they haven't been locally modified
  useEffect(() => {
    // Skip if values were just updated locally
    if (locallyUpdated.current) {
      locallyUpdated.current = false;
      return;
    }

    // Skip if customFieldValues haven't changed (by reference or deep comparison)
    if (
      prevCustomFieldValuesRef.current === customFieldValues ||
      utils.areCustomFieldValuesEqual(
        prevCustomFieldValuesRef.current,
        customFieldValues,
      )
    ) {
      return;
    }

    // Update our reference
    prevCustomFieldValuesRef.current = customFieldValues;

    const newValues = getValuesRecord(customFieldValues);

    // Deep comparison to avoid unnecessary updates
    let hasChanges = false;

    // Check for added or modified values
    for (const [fieldId, value] of Object.entries(newValues)) {
      const numId = Number(fieldId);
      if (!(numId in values) || values[numId] !== value) {
        hasChanges = true;
        break;
      }
    }

    // Check for removed values
    if (!hasChanges) {
      for (const fieldId of Object.keys(values)) {
        if (!(fieldId in newValues)) {
          hasChanges = true;
          break;
        }
      }
    }

    if (hasChanges) {
      setValues(newValues);
    }
  }, [customFieldValues, getValuesRecord, values]);

  // Process updates when debounced values change
  useEffect(() => {
    // Reset update sent flag when values change
    updateSentRef.current = false;

    // Get current prop values for comparison
    const currentPropValues = getValuesRecord(customFieldValues);

    // Check if any value actually changed from props
    const hasChanges = Object.entries(debouncedValues).some(
      ([idStr, value]) => {
        const id = Number(idStr);
        return currentPropValues[id] !== value;
      },
    );

    if (!hasChanges) return;

    const updatedValues: CustomFieldValue[] = [];

    for (const [idStr, value] of Object.entries(debouncedValues)) {
      const fieldId = Number(idStr);
      const existing = customFieldValues.find(
        v => v.field_definition === fieldId,
      );

      if (existing) {
        // Update existing only if value changed
        if (existing.value !== value) {
          updatedValues.push({ ...existing, value });
        }
      } else if (value.trim()) {
        // Create new if has value
        updatedValues.push({
          field_definition: fieldId,
          patient: patientId,
          value,
        } as CustomFieldValue);
      }
    }

    if (updatedValues.length > 0 && !updateSentRef.current) {
      updateSentRef.current = true;
      locallyUpdated.current = true; // Mark that we're initiating an update

      // Create a complete updated array (including unchanged values)
      const allValues = [...customFieldValues];

      // Update existing or add new values
      updatedValues.forEach(newVal => {
        const existingIndex = allValues.findIndex(
          v => v.field_definition === newVal.field_definition,
        );

        if (existingIndex >= 0) {
          allValues[existingIndex] = newVal;
        } else {
          allValues.push(newVal);
        }
      });

      // Only call onUpdate if the values are actually different
      if (!utils.areCustomFieldValuesEqual(allValues, customFieldValues)) {
        onUpdate(allValues);
      }
    }
  }, [
    debouncedValues,
    customFieldValues,
    patientId,
    onUpdate,
    getValuesRecord,
  ]);

  // Handle input change
  const handleChange = (fieldId: number, value: string) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    locallyUpdated.current = true;
  };

  // Add new field
  const [newFieldName, setNewFieldName] = useState('');
  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    addFieldMutation.mutate(newFieldName.trim(), {
      onSuccess: () => setNewFieldName(''),
    });
  };

  // Error handling text
  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : 'Failed to load fields'
    : addFieldMutation.error instanceof Error
      ? addFieldMutation.error.message
      : null;

  return (
    <div className="space-y-6">
      {/* Header & Add Field Form */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Additional Information{' '}
          {customFields?.length > 0 && `(${customFields.length} fields)`}
        </h2>

        <form onSubmit={handleAddField} className="flex items-center space-x-2">
          <input
            type="text"
            value={newFieldName}
            onChange={e => setNewFieldName(e.target.value)}
            placeholder="New field name"
            className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={addFieldMutation.isLoading}
          />
          <button
            type="submit"
            disabled={addFieldMutation.isLoading || !newFieldName.trim()}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addFieldMutation.isLoading ? 'Adding...' : 'Add Field'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="text-red-500 text-sm">{errorMessage}</div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-4 text-center text-gray-500">
          Loading custom fields...
        </div>
      ) : customFields.length === 0 ? (
        <div className="py-4 text-center text-gray-500">
          No custom fields available. Add your first custom field above.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {customFields.map(field => (
            <div key={field.id} className="space-y-2">
              <label
                htmlFor={`field-${field.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                {field.name}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                id={`field-${field.id}`}
                type="text"
                value={values[field.id] || ''}
                onChange={e => handleChange(field.id, e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main component with QueryClientProvider
export const AdditionalPatientInfo = memo(function AdditionalPatientInfo(
  props: Props,
) {
  // Create a client
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AdditionalPatientInfoInner {...props} />
    </QueryClientProvider>
  );
});

AdditionalPatientInfo.displayName = 'AdditionalPatientInfo';
