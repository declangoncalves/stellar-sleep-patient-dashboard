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
import { Button } from '../../../components/Button/Button';
import { Input } from '@/components/Input/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { PlusIcon } from '@heroicons/react/24/solid';
interface Props {
  patientId: number;
  customFieldValues?: CustomFieldValue[];
  onUpdate: (updatedValues: CustomFieldValue[]) => void;
}

// Create a singleton QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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

  // Local state for field values
  const [values, setValues] = useState<Record<string, string>>(
    getValuesRecord(customFieldValues),
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
    isFetching,
    error,
  } = useQuery<CustomField[], Error>(
    'customFields',
    customFieldsApi.fetchCustomFields,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  );

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

    // Only update values that haven't been modified locally
    setValues(prev => {
      const updatedValues = { ...prev };
      let hasChanges = false;

      // Update values from props that haven't been modified locally
      for (const [fieldId, value] of Object.entries(newValues)) {
        if (!locallyUpdated.current || !(fieldId in prev)) {
          if (updatedValues[fieldId] !== value) {
            updatedValues[fieldId] = value;
            hasChanges = true;
          }
        }
      }

      // Remove values that no longer exist in props
      for (const fieldId of Object.keys(prev)) {
        if (!(fieldId in newValues)) {
          delete updatedValues[fieldId];
          hasChanges = true;
        }
      }

      return hasChanges ? updatedValues : prev;
    });
  }, [customFieldValues, getValuesRecord]);

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

    const updatedValues: CustomFieldValue[] = Object.entries(debouncedValues)
      .map(([idStr, value]) => {
        const existing = customFieldValues.find(
          v => v.field_definition === idStr,
        );

        if (existing) {
          return { ...existing, value };
        } else {
          return {
            id: '0', // Temporary ID for new values
            field_definition: idStr,
            patient: patientId.toString(),
            value,
          };
        }
      })
      .filter(Boolean) as CustomFieldValue[];

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

  // Error handling text
  const errorMessage = useMemo(() => {
    if (error) {
      if (error instanceof Error) {
        return error.message;
      }
      // Handle API error responses
      if (typeof error === 'object' && error !== null) {
        const apiError = error as {
          status?: number;
          message?: string;
          detail?: string;
        };
        if (apiError.status === 404) {
          return 'Custom fields not found. Please try again later.';
        }
        if (apiError.status === 403) {
          return 'You do not have permission to access custom fields.';
        }
        if (apiError.detail) {
          return apiError.detail;
        }
        if (apiError.message) {
          return apiError.message;
        }
      }
      return 'Failed to load custom fields. Please try again later.';
    }
    return null;
  }, [error]);

  // Field name validation
  const validateNewFieldName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Field name cannot be empty';
    }
    if (name.length > 100) {
      return 'Field name cannot exceed 100 characters';
    }
    if (
      customFields.some(
        field => field.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return 'A field with this name already exists';
    }
    return null;
  };

  // Handle adding a new field
  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldName = newFieldName.trim();

    // Validate field name
    const validationError = validateNewFieldName(fieldName);
    if (validationError) {
      setFieldNameError(validationError);
      return;
    }

    try {
      await addFieldMutation.mutateAsync(fieldName);
      setNewFieldName('');
      setFieldNameError(null);
    } catch (error) {
      if (error instanceof Error) {
        setFieldNameError(error.message);
      } else if (typeof error === 'object' && error !== null) {
        const apiError = error as { detail?: string; message?: string };
        setFieldNameError(
          apiError.detail || apiError.message || 'Failed to create field',
        );
      } else {
        setFieldNameError('Failed to create field. Please try again.');
      }
    }
  };

  // Handle field name input change
  const handleNewFieldNameChange = (value: string) => {
    setNewFieldName(value);
    // Clear error when user starts typing
    if (fieldNameError) {
      setFieldNameError(null);
    }
  };

  // Handle field value change
  const handleChange = (fieldId: string, value: string) => {
    setValues(prev => {
      const newValues = { ...prev, [fieldId]: value };
      locallyUpdated.current = true;
      return newValues;
    });
  };

  // Add new field with validation
  const [newFieldName, setNewFieldName] = useState('');
  const [fieldNameError, setFieldNameError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Error banner for API errors */}
      {errorMessage && (
        <div
          className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
          role="alert"
        >
          <span className="font-medium">Error:</span> {errorMessage}
        </div>
      )}

      {/* Loading state */}
      {isFetching && !customFields.length ? (
        <div className="flex items-center justify-center py-4">
          <div
            role="status"
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
          />
        </div>
      ) : error ? (
        <div className="text-red-500">Failed to fetch: {errorMessage}</div>
      ) : (
        <>
          {/* Add new field form */}
          <form onSubmit={handleAddField} className="mb-6">
            <div className="flex grid-cols-2 items-start justify-start gap-4 pb-6 mb-2 border-b border-gray-200">
              <div className="flex-1">
                <Input
                  id="new-field-name"
                  label="Add New Field"
                  value={newFieldName}
                  onChange={e => handleNewFieldNameChange(e.target.value)}
                  error={fieldNameError || undefined}
                  placeholder="Enter field name"
                  maxLength={100}
                />
              </div>
              <Button
                type="submit"
                disabled={addFieldMutation.isLoading}
                variant="primary"
                className="h-12 mt-7"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {addFieldMutation.isLoading ? 'Adding...' : 'Add New Field'}
              </Button>
            </div>
          </form>

          {/* Custom fields list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
            {customFields.map(field => (
              <div key={field.id} className="flex flex-col space-y-1">
                <Input
                  id={`field-${field.id}`}
                  label={field.name}
                  value={values[field.id] || ''}
                  onChange={e =>
                    handleChange(field.id.toString(), e.target.value)
                  }
                  required={field.required}
                  error={
                    field.required && !values[field.id]
                      ? 'This field is required'
                      : undefined
                  }
                  placeholder={`Enter ${field.name.toLowerCase()}`}
                  maxLength={500}
                />
              </div>
            ))}
            {customFields.length === 0 && (
              <div className="pl-2 pt-4 text-gray-500">
                No custom fields added
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Main component with QueryClientProvider
export const AdditionalPatientInfo = memo(function AdditionalPatientInfo(
  props: Props,
) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdditionalPatientInfoInner {...props} />
    </QueryClientProvider>
  );
});

AdditionalPatientInfo.displayName = 'AdditionalPatientInfo';
