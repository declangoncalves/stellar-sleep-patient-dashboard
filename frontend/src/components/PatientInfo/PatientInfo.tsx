'use client';

import { useState } from 'react';
import { Patient, Address } from '@/lib/types';
import axios from 'axios';
import clsx from 'clsx';
import { Button } from '@/components/Button/Button';

interface PatientInfoProps {
  patient: Patient;
  onSaved: (updated: Patient) => void;
  onClose: () => void;
  isCreateMode?: boolean;
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

export function PatientInfo({
  patient,
  onSaved,
  onClose,
  isCreateMode = false,
}: PatientInfoProps) {
  const [formData, setFormData] = useState<FormData>({
    id: patient.id,
    first_name: patient.first_name || '',
    middle_name: patient.middle_name || '',
    last_name: patient.last_name || '',
    date_of_birth: patient.date_of_birth || '',
    status: patient.status || 'inquiry',
    addresses: patient.addresses || [],
    created_at: patient.created_at || new Date().toISOString(),
    updated_at: patient.updated_at || new Date().toISOString(),
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
      let updatedPatient: Patient;

      if (isCreateMode) {
        // Create new patient
        const response = await axios.post(
          'http://127.0.0.1:8000/api/patients/',
          {
            first_name: formData.first_name,
            last_name: formData.last_name,
            middle_name: formData.middle_name,
            date_of_birth: formData.date_of_birth,
            status: formData.status,
          },
        );
        updatedPatient = response.data;

        // Create addresses for new patient
        for (const address of formData.addresses) {
          await axios.post('http://127.0.0.1:8000/api/addresses/', {
            ...address,
            patient: updatedPatient.id,
          });
        }
      } else {
        // Update existing patient
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

        updatedPatient = {
          ...formData,
          addresses: formData.addresses.map(addr => ({
            ...addr,
            id: addr.id || 0,
          })),
        };
      }

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
    <div className="w-full h-full bg-white rounded-xl p-6 space-y-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {isCreateMode ? 'Add New Patient' : 'Edit Patient'}
        </h2>
        <Button onClick={onClose} variant="ghost" size="sm">
          ×
        </Button>
      </div>
      <form
        id="patient-form"
        name="patient-form"
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name
            </label>
            <input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={`p-2 border rounded w-full text-black ${errors.first_name ? inputErrorClasses : ''}`}
              placeholder="First name"
              autoComplete="given-name"
            />
            {errors.first_name && (
              <p className={errorMessageClasses}>{errors.first_name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="middle_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Middle Name
            </label>
            <input
              id="middle_name"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
              placeholder="Middle name"
              className="p-2 border rounded w-full text-black"
              autoComplete="additional-name"
            />
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name
            </label>
            <input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last name"
              className={`p-2 border rounded w-full text-black ${errors.last_name ? inputErrorClasses : ''}`}
              autoComplete="family-name"
            />
            {errors.last_name && (
              <p className={errorMessageClasses}>{errors.last_name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="date_of_birth"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date of Birth
            </label>
            <input
              id="date_of_birth"
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className={`p-2 border rounded w-full text-black ${errors.date_of_birth ? inputErrorClasses : ''}`}
              autoComplete="bday"
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
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
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
            <Button onClick={handleAddAddress} variant="primary" size="sm">
              Add Address
            </Button>
          </div>
          {formData.addresses.map((addr, index) => (
            <div
              key={addr.id ?? index}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border p-4 rounded bg-gray-50 relative"
            >
              <Button
                onClick={() => {
                  const updated = formData.addresses.filter(
                    (_, i) => i !== index,
                  );
                  setFormData({ ...formData, addresses: updated });
                }}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                ×
              </Button>
              <div>
                <label
                  htmlFor={`address_line1_${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address Line 1
                </label>
                <input
                  id={`address_line1_${index}`}
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
                <label
                  htmlFor={`address_line2_${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address Line 2
                </label>
                <input
                  id={`address_line2_${index}`}
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
                <label
                  htmlFor={`city_${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  City
                </label>
                <input
                  id={`city_${index}`}
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
                <label
                  htmlFor={`state_${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  State
                </label>
                <input
                  id={`state_${index}`}
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
                <label
                  htmlFor={`postal_code_${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Postal Code
                </label>
                <input
                  id={`postal_code_${index}`}
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
                <label
                  htmlFor={`country_${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Country
                </label>
                <input
                  id={`country_${index}`}
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
          <Button
            type="submit"
            disabled={isSaving}
            variant="primary"
            isLoading={isSaving}
          >
            Save
          </Button>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
          {saveStatus === 'success' && (
            <p className="text-green-600 self-center">Saved!</p>
          )}
          {saveStatus === 'error' && (
            <p className="text-red-600 self-center">Failed to save.</p>
          )}
        </div>
      </form>
    </div>
  );
}
