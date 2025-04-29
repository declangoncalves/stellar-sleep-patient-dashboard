'use client';

import { memo } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/Button/Button';
import {
  PatientFormData,
  ValidationErrors,
  AddressError,
  Address,
} from '@/lib/types';
import { Input } from '@/components/Input/Input';

interface GeneralPatientInfoProps {
  formData: PatientFormData;
  errors?: ValidationErrors;
  onUpdate: (field: keyof PatientFormData, value: string) => void;
  onUpdateAddress: (index: number, field: keyof Address, value: string) => void;
  onAddAddress: () => void;
  onRemoveAddress: (index: number) => void;
}

export const GeneralPatientInfo = memo(function GeneralPatientInfo({
  formData,
  errors = {},
  onUpdate,
  onUpdateAddress,
  onAddAddress,
  onRemoveAddress,
}: GeneralPatientInfoProps) {
  // Helper function to get error message text
  const getErrorMessage = (
    error: ValidationErrors[keyof ValidationErrors],
  ): string => {
    if (!error) return '';
    if (typeof error === 'string') return error;
    if ('address_line1' in error || 'address_line2' in error) {
      return Object.values(error).filter(Boolean).join(', ');
    }
    return JSON.stringify(error);
  };

  // Helper function to get address error
  const getAddressError = (
    errors: ValidationErrors,
    index: number,
  ): AddressError | undefined => {
    return errors.addresses?.[index];
  };

  return (
    <div className="space-y-6">
      {/* Basic Information Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First Name"
            value={formData.first_name}
            onChange={e => onUpdate('first_name', e.target.value)}
            error={errors.first_name}
            required
          />
          <Input
            label="Last Name"
            value={formData.last_name}
            onChange={e => onUpdate('last_name', e.target.value)}
            error={errors.last_name}
            required
          />
        </div>
        <Input
          label="Date of Birth"
          type="date"
          value={formData.date_of_birth}
          onChange={e => onUpdate('date_of_birth', e.target.value)}
          error={errors.date_of_birth}
          required
        />
        <Input
          label="Last Visit"
          type="date"
          value={formData.last_visit || ''}
          onChange={e => onUpdate('last_visit', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={e => onUpdate('status', e.target.value)}
            className={clsx(
              'w-full p-2 border rounded',
              errors.status ? 'border-red-500' : 'border-gray-300',
            )}
          >
            <option value="">Select Status</option>
            <option value="inquiry">Inquiry</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="churned">Churned</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">
              {getErrorMessage(errors.status)}
            </p>
          )}
        </div>
      </div>

      {/* Addresses Section */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Addresses (Optional)</h3>
          <Button variant="outline" onClick={onAddAddress}>
            Add Address
          </Button>
        </div>
        <div className="space-y-4">
          {formData.addresses.map((address, index) => {
            const addressError = getAddressError(errors, index);
            return (
              <div key={index} className="border p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={address.address_line1}
                      onChange={e =>
                        onUpdateAddress(index, 'address_line1', e.target.value)
                      }
                      className={clsx(
                        'w-full p-2 border rounded',
                        addressError?.address_line1
                          ? 'border-red-500'
                          : 'border-gray-300',
                      )}
                    />
                    {addressError?.address_line1 && (
                      <p className="mt-1 text-sm text-red-600">
                        {addressError.address_line1}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={address.address_line2 || ''}
                      onChange={e =>
                        onUpdateAddress(index, 'address_line2', e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={e =>
                        onUpdateAddress(index, 'city', e.target.value)
                      }
                      className={clsx(
                        'w-full p-2 border rounded',
                        addressError?.city
                          ? 'border-red-500'
                          : 'border-gray-300',
                      )}
                    />
                    {addressError?.city && (
                      <p className="mt-1 text-sm text-red-600">
                        {addressError.city}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={e =>
                        onUpdateAddress(index, 'state', e.target.value)
                      }
                      className={clsx(
                        'w-full p-2 border rounded',
                        addressError?.state
                          ? 'border-red-500'
                          : 'border-gray-300',
                      )}
                    />
                    {addressError?.state && (
                      <p className="mt-1 text-sm text-red-600">
                        {addressError.state}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={address.postal_code}
                        onChange={e =>
                          onUpdateAddress(index, 'postal_code', e.target.value)
                        }
                        className={clsx(
                          'w-full p-2 border rounded',
                          addressError?.postal_code
                            ? 'border-red-500'
                            : 'border-gray-300',
                        )}
                      />
                      <Button
                        variant="outline"
                        onClick={() => onRemoveAddress(index)}
                      >
                        Delete
                      </Button>
                    </div>
                    {addressError?.postal_code && (
                      <p className="mt-1 text-sm text-red-600">
                        {addressError.postal_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

GeneralPatientInfo.displayName = 'GeneralPatientInfo';
