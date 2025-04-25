'use client';

import { useState } from 'react';
import { Patient, Address } from '@/lib/types';
import axios from 'axios';
import clsx from 'clsx';

interface PatientInfoProps {
  patient: Patient;
  onSaved: (updated: Patient) => void;
  onClose: () => void;
}

interface FormData extends Omit<Patient, 'addresses'> {
  addresses: (Address | (Omit<Address, 'id'> & { id: number | null }))[];
}

interface AddressError {
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface ValidationErrors {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  status?: string;
  addresses?: { [key: number]: AddressError };
}

export function PatientInfo({ patient, onSaved, onClose }: PatientInfoProps) {
  const [formData, setFormData] = useState<FormData>({
    ...patient,
    addresses: patient.addresses || [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Validate patient fields
    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
      isValid = false;
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
      isValid = false;
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
      isValid = false;
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
      isValid = false;
    }

    // Validate addresses
    const addressErrors: { [key: number]: AddressError } = {};
    formData.addresses.forEach((addr, index) => {
      const errors: AddressError = {};
      if (!addr.address_line1?.trim()) {
        errors.address_line1 = 'Address line 1 is required';
        isValid = false;
      }
      if (!addr.city?.trim()) {
        errors.city = 'City is required';
        isValid = false;
      }
      if (!addr.state?.trim()) {
        errors.state = 'State is required';
        isValid = false;
      }
      if (!addr.postal_code?.trim()) {
        errors.postal_code = 'Postal code is required';
        isValid = false;
      }
      if (!addr.country?.trim()) {
        errors.country = 'Country is required';
        isValid = false;
      }
      if (Object.keys(errors).length > 0) {
        addressErrors[index] = errors;
      }
    });

    if (Object.keys(addressErrors).length > 0) {
      newErrors.addresses = addressErrors;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // First update the patient
      await axios.put(`http://127.0.0.1:8000/api/patients/${formData.id}/`, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name,
        date_of_birth: formData.date_of_birth,
        status: formData.status,
      });

      // Then handle addresses
      for (const address of formData.addresses) {
        if (address.id && address.id < 1000) {
          await axios.put(
            `http://127.0.0.1:8000/api/addresses/${address.id}/`,
            {
              ...address,
              patient: formData.id,
            },
          );
        } else {
          const addressData = { ...address } as Omit<Address, 'id'>;
          await axios.post('http://127.0.0.1:8000/api/addresses/', {
            ...addressData,
            patient: formData.id,
          });
        }
      }

      const updatedPatient: Patient = {
        ...formData,
        addresses: formData.addresses.map(addr => ({
          ...addr,
          id: addr.id || 0,
        })),
      };

      setSaveStatus('success');
      onSaved(updatedPatient);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = () => {
    const newAddress: Omit<Address, 'id'> & { id: null } = {
      id: null,
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    };
    setFormData({
      ...formData,
      addresses: [...formData.addresses, newAddress],
    });
  };

  const statusClasses = clsx(
    'inline-block px-3 py-1 text-sm font-semibold rounded-full capitalize',
    {
      'bg-yellow-100 text-yellow-800': formData.status === 'inquiry',
      'bg-blue-100 text-blue-800': formData.status === 'onboarding',
      'bg-green-100 text-green-800': formData.status === 'active',
      'bg-red-100 text-red-800': formData.status === 'churned',
    },
  );

  const inputErrorClasses =
    'border-red-500 focus:ring-red-500 focus:border-red-500';
  const errorMessageClasses = 'text-red-500 text-sm mt-1';

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6 space-y-6 overflow-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <input
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={`p-2 border rounded w-full text-black ${errors.first_name ? inputErrorClasses : ''}`}
            placeholder="First name"
          />
          {errors.first_name && (
            <p className={errorMessageClasses}>{errors.first_name}</p>
          )}
        </div>

        <div>
          <input
            name="middle_name"
            value={formData.middle_name}
            onChange={handleChange}
            placeholder="Middle name"
            className="p-2 border rounded w-full text-black"
          />
        </div>

        <div>
          <input
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Last name"
            className={`p-2 border rounded w-full text-black ${errors.last_name ? inputErrorClasses : ''}`}
          />
          {errors.last_name && (
            <p className={errorMessageClasses}>{errors.last_name}</p>
          )}
        </div>

        <div>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className={`p-2 border rounded w-full text-black ${errors.date_of_birth ? inputErrorClasses : ''}`}
          />
          {errors.date_of_birth && (
            <p className={errorMessageClasses}>{errors.date_of_birth}</p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2">
          <span className={statusClasses}>{formData.status}</span>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Update Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className={`p-2 border rounded w-full text-black ${errors.status ? inputErrorClasses : ''}`}
        >
          <option value="">Select Status</option>
          <option value="inquiry">Inquiry</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="churned">Churned</option>
        </select>
        {errors.status && (
          <p className={errorMessageClasses}>{errors.status}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold text-gray-800">Addresses</h4>
          <button
            onClick={handleAddAddress}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Address
          </button>
        </div>
        {formData.addresses.map((addr, index) => (
          <div
            key={addr.id ?? index}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border p-4 rounded bg-gray-50 relative"
          >
            <button
              onClick={() => {
                const updated = formData.addresses.filter(
                  (_, i) => i !== index,
                );
                setFormData({ ...formData, addresses: updated });
              }}
              className="absolute top-2 right-2 text-red-600 hover:text-red-800"
            >
              ×
            </button>
            <div>
              <input
                name="address_line1"
                placeholder="Address Line 1"
                value={addr.address_line1}
                onChange={e => {
                  const updated = [...formData.addresses];
                  updated[index].address_line1 = e.target.value;
                  setFormData({ ...formData, addresses: updated });
                  // Clear error when field is modified
                  if (errors.addresses?.[index]?.address_line1) {
                    setErrors(prev => ({
                      ...prev,
                      addresses: {
                        ...prev.addresses,
                        [index]: {
                          ...prev.addresses?.[index],
                          address_line1: undefined,
                        },
                      },
                    }));
                  }
                }}
                className={`p-2 border rounded w-full text-black ${errors.addresses?.[index]?.address_line1 ? inputErrorClasses : ''}`}
              />
              {errors.addresses?.[index]?.address_line1 && (
                <p className={errorMessageClasses}>
                  {errors.addresses[index].address_line1}
                </p>
              )}
            </div>
            <div>
              <input
                name="address_line2"
                placeholder="Address Line 2"
                value={addr.address_line2}
                onChange={e => {
                  const updated = [...formData.addresses];
                  updated[index].address_line2 = e.target.value;
                  setFormData({ ...formData, addresses: updated });
                }}
                className="p-2 border rounded w-full text-black"
              />
            </div>
            <div>
              <input
                name="city"
                placeholder="City"
                value={addr.city}
                onChange={e => {
                  const updated = [...formData.addresses];
                  updated[index].city = e.target.value;
                  setFormData({ ...formData, addresses: updated });
                  // Clear error when field is modified
                  if (errors.addresses?.[index]?.city) {
                    setErrors(prev => ({
                      ...prev,
                      addresses: {
                        ...prev.addresses,
                        [index]: {
                          ...prev.addresses?.[index],
                          city: undefined,
                        },
                      },
                    }));
                  }
                }}
                className={`p-2 border rounded w-full text-black ${errors.addresses?.[index]?.city ? inputErrorClasses : ''}`}
              />
              {errors.addresses?.[index]?.city && (
                <p className={errorMessageClasses}>
                  {errors.addresses[index].city}
                </p>
              )}
            </div>
            <div>
              <input
                name="state"
                placeholder="State"
                value={addr.state}
                onChange={e => {
                  const updated = [...formData.addresses];
                  updated[index].state = e.target.value;
                  setFormData({ ...formData, addresses: updated });
                  // Clear error when field is modified
                  if (errors.addresses?.[index]?.state) {
                    setErrors(prev => ({
                      ...prev,
                      addresses: {
                        ...prev.addresses,
                        [index]: {
                          ...prev.addresses?.[index],
                          state: undefined,
                        },
                      },
                    }));
                  }
                }}
                className={`p-2 border rounded w-full text-black ${errors.addresses?.[index]?.state ? inputErrorClasses : ''}`}
              />
              {errors.addresses?.[index]?.state && (
                <p className={errorMessageClasses}>
                  {errors.addresses[index].state}
                </p>
              )}
            </div>
            <div>
              <input
                name="postal_code"
                placeholder="Postal Code"
                value={addr.postal_code}
                onChange={e => {
                  const updated = [...formData.addresses];
                  updated[index].postal_code = e.target.value;
                  setFormData({ ...formData, addresses: updated });
                  // Clear error when field is modified
                  if (errors.addresses?.[index]?.postal_code) {
                    setErrors(prev => ({
                      ...prev,
                      addresses: {
                        ...prev.addresses,
                        [index]: {
                          ...prev.addresses?.[index],
                          postal_code: undefined,
                        },
                      },
                    }));
                  }
                }}
                className={`p-2 border rounded w-full text-black ${errors.addresses?.[index]?.postal_code ? inputErrorClasses : ''}`}
              />
              {errors.addresses?.[index]?.postal_code && (
                <p className={errorMessageClasses}>
                  {errors.addresses[index].postal_code}
                </p>
              )}
            </div>
            <div>
              <input
                name="country"
                placeholder="Country"
                value={addr.country}
                onChange={e => {
                  const updated = [...formData.addresses];
                  updated[index].country = e.target.value;
                  setFormData({ ...formData, addresses: updated });
                  // Clear error when field is modified
                  if (errors.addresses?.[index]?.country) {
                    setErrors(prev => ({
                      ...prev,
                      addresses: {
                        ...prev.addresses,
                        [index]: {
                          ...prev.addresses?.[index],
                          country: undefined,
                        },
                      },
                    }));
                  }
                }}
                className={`p-2 border rounded w-full text-black ${errors.addresses?.[index]?.country ? inputErrorClasses : ''}`}
              />
              {errors.addresses?.[index]?.country && (
                <p className={errorMessageClasses}>
                  {errors.addresses[index].country}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Close
        </button>
        {saveStatus === 'success' && (
          <p className="text-green-600 self-center">Saved!</p>
        )}
        {saveStatus === 'error' && (
          <p className="text-red-600 self-center">Failed to save.</p>
        )}
      </div>
    </div>
  );
}
