'use client';

import { memo } from 'react';
import { Button } from '@/components/Button/Button';
import {
  PatientFormData,
  ValidationErrors,
  AddressError,
  Address,
} from '@/lib/types';
import { Input } from '@/components/Input/Input';
import { PlusIcon } from '@heroicons/react/24/solid';
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="First Name"
            value={formData.first_name}
            onChange={e => onUpdate('first_name', e.target.value)}
            error={errors.first_name}
            required
          />
          <Input
            label="Middle Name"
            value={formData.middle_name}
            onChange={e => onUpdate('middle_name', e.target.value)}
            error={errors.middle_name}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <Input
            label="Status"
            value={formData.status}
            onChange={e => onUpdate('status', e.target.value)}
            error={errors.status}
            required
            options={[
              { value: '', label: 'Select Status' },
              { value: 'inquiry', label: 'Inquiry' },
              { value: 'onboarding', label: 'Onboarding' },
              { value: 'active', label: 'Active' },
              { value: 'churned', label: 'Churned' },
            ]}
          />
        </div>
      </div>

      {/* Addresses Section */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Addresses</h3>
          <Button variant="primary" onClick={onAddAddress}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        </div>
        <div className="space-y-4">
          {formData.addresses.map((address, index) => {
            const addressError = getAddressError(errors, index);
            return (
              <div key={index} className="bg-gray-100 p-6 rounded-sm">
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Address Line 1"
                    value={address.address_line1}
                    onChange={e =>
                      onUpdateAddress(index, 'address_line1', e.target.value)
                    }
                    error={addressError?.address_line1}
                  />
                  <Input
                    label="Address Line 2"
                    value={address.address_line2 || ''}
                    onChange={e =>
                      onUpdateAddress(index, 'address_line2', e.target.value)
                    }
                  />
                  <Input
                    label="City"
                    value={address.city}
                    onChange={e =>
                      onUpdateAddress(index, 'city', e.target.value)
                    }
                    error={addressError?.city}
                  />
                  <Input
                    label="State"
                    value={address.state}
                    onChange={e =>
                      onUpdateAddress(index, 'state', e.target.value)
                    }
                    error={addressError?.state}
                  />
                  <Input
                    label="Postal Code"
                    value={address.postal_code}
                    onChange={e =>
                      onUpdateAddress(index, 'postal_code', e.target.value)
                    }
                    error={addressError?.postal_code}
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="danger"
                      onClick={() => onRemoveAddress(index)}
                      className="self-end"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {formData.addresses.length === 0 && (
            <div className="text-gray-500">No addresses added</div>
          )}
        </div>
      </div>
    </div>
  );
});

GeneralPatientInfo.displayName = 'GeneralPatientInfo';
