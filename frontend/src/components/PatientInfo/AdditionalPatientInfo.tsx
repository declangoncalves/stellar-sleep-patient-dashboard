import { useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/Button/Button';

interface AdditionalField {
  id: string;
  name: string;
  value: string;
}

interface AdditionalPatientInfoProps {
  fields: AdditionalField[];
  onChange: (fields: AdditionalField[]) => void;
  errors?: Record<string, string>;
}

export const AdditionalPatientInfo: React.FC<AdditionalPatientInfoProps> = ({
  fields,
  onChange,
  errors = {},
}) => {
  const [newFieldName, setNewFieldName] = useState('');

  const handleFieldChange = (id: string, value: string) => {
    const updatedFields = fields.map(field =>
      field.id === id ? { ...field, value } : field,
    );
    onChange(updatedFields);
  };

  const handleNameChange = (id: string, name: string) => {
    const updatedFields = fields.map(field =>
      field.id === id ? { ...field, name } : field,
    );
    onChange(updatedFields);
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;

    const newField: AdditionalField = {
      id: Date.now().toString(),
      name: newFieldName.trim(),
      value: '',
    };

    onChange([...fields, newField]);
    setNewFieldName('');
  };

  const handleDeleteField = (id: string) => {
    onChange(fields.filter(field => field.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={newFieldName}
          onChange={e => setNewFieldName(e.target.value)}
          placeholder="Enter field name"
          className="flex-1 p-2 border border-gray-300 rounded"
        />
        <Button variant="primary" onClick={handleAddField}>
          Add Field
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map(field => (
          <div
            key={field.id}
            className="grid grid-cols-2 gap-4 p-4 border rounded"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name
              </label>
              <input
                type="text"
                value={field.name}
                onChange={e => handleNameChange(field.id, e.target.value)}
                className={clsx(
                  'w-full p-2 border rounded',
                  errors[`field_${field.id}_name`]
                    ? 'border-red-500'
                    : 'border-gray-300',
                )}
              />
              {errors[`field_${field.id}_name`] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[`field_${field.id}_name`]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={field.value}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  className={clsx(
                    'w-full p-2 border rounded',
                    errors[`field_${field.id}_value`]
                      ? 'border-red-500'
                      : 'border-gray-300',
                  )}
                />
                <Button
                  variant="outline"
                  onClick={() => handleDeleteField(field.id)}
                  className="whitespace-nowrap"
                >
                  Delete
                </Button>
              </div>
              {errors[`field_${field.id}_value`] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[`field_${field.id}_value`]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
