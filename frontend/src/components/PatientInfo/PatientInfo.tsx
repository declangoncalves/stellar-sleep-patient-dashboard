'use client';

import { useState } from 'react';
import { Patient, Address, ISIScore } from '@/lib/types';
import axios from 'axios';
import clsx from 'clsx';
import { Button } from '@/components/Button/Button'; // pages/patient/[id].tsx
import { LineChart } from '@/components/LineChart/LineChart';

export default function PatientPage({ patient }) {
  // assume patient.isiScores is { date: string; score: number }[]
  const chartData = patient.isiScores.map(({ score, date }) => ({
    x: date,
    y: score as number,
  }));

  return (
    <div>
      {/* …other tabs/content… */}
      <LineChart data={chartData} />
    </div>
  );
}

type TabType = 'basic' | 'sleep' | 'additional';

interface PatientInfoProps {
  patient: Patient;
  onSaved: (updated: Patient) => void;
  onClose: () => void;
  isCreateMode?: boolean;
}

interface FormData extends Omit<Patient, 'addresses' | 'isi_scores'> {
  addresses: (Address | (Omit<Address, 'id'> & { id: number | null }))[];
  isi_scores: (ISIScore | (Omit<ISIScore, 'id'> & { id: null }))[];
  created_at: string;
  updated_at: string;
  ready_to_discharge: boolean;
  middle_name?: string;
}

interface AddressError {
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

interface ValidationErrors {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  status?: string;
  last_visit?: string;
  addresses?: { [key: number]: AddressError };
  isi_scores?: { [key: number]: string };
}

export function PatientInfo({
  patient,
  onSaved,
  onClose,
  isCreateMode = false,
}: PatientInfoProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState<FormData>({
    id: patient.id,
    first_name: patient.first_name,
    middle_name: patient.middle_name,
    last_name: patient.last_name,
    date_of_birth: patient.date_of_birth,
    status: patient.status,
    last_visit: patient.last_visit,
    isi_scores: patient.isi_scores || [],
    addresses: patient.addresses || [],
    created_at: patient.created_at || new Date().toISOString(),
    updated_at: patient.updated_at || new Date().toISOString(),
    ready_to_discharge: patient.ready_to_discharge || false,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

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

    // Validate ISI scores
    const isiScoreErrors: { [key: number]: string } = {};
    formData.isi_scores.forEach((score, index) => {
      if (
        score.score === undefined ||
        score.score === null ||
        isNaN(score.score)
      ) {
        isiScoreErrors[index] = 'Score is required';
        isValid = false;
      } else if (score.score < 0 || score.score > 28) {
        isiScoreErrors[index] = 'Score must be between 0 and 28';
        isValid = false;
      }
      if (!score.date) {
        isiScoreErrors[index] = 'Date is required';
        isValid = false;
      }
    });
    if (Object.keys(isiScoreErrors).length > 0) {
      newErrors.isi_scores = isiScoreErrors;
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
            date_of_birth: formData.date_of_birth,
            status: formData.status,
            last_visit: formData.last_visit,
          },
        );
        updatedPatient = response.data;
      } else {
        // Update existing patient
        const response = await axios.put(
          `http://127.0.0.1:8000/api/patients/${formData.id}/`,
          {
            first_name: formData.first_name,
            last_name: formData.last_name,
            date_of_birth: formData.date_of_birth,
            status: formData.status,
            last_visit: formData.last_visit,
            addresses: formData.addresses.map(address => ({
              address_line1: address.address_line1,
              address_line2: address.address_line2,
              city: address.city,
              state: address.state,
              postal_code: address.postal_code,
            })),
            isi_scores: formData.isi_scores.map(score => ({
              score: score.score,
              date: score.date,
            })),
          },
        );
        updatedPatient = response.data;
      }

      onSaved(updatedPatient);
    } catch (error) {
      console.error('Error saving patient:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteISIScore = (index: number) => {
    setFormData(prev => ({
      ...prev,
      isi_scores: prev.isi_scores.filter((_, i) => i !== index),
    }));
  };

  const handleAddAddress = () => {
    const newAddress: Address = {
      id: null,
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      created_at: '',
      updated_at: '',
    };
    setFormData(prev => ({
      ...prev,
      addresses: [...prev.addresses, newAddress],
    }));
  };

  const handleAddressChange = (
    index: number,
    field: keyof Address,
    value: string,
  ) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((address, i) =>
        i === index ? { ...address, [field]: value || '' } : address,
      ),
    }));
  };

  const renderAddresses = () => (
    <div className="space-y-4 pb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Addresses</h3>
      </div>
      {formData.addresses.map((address, index) => (
        <div
          key={index}
          className="border border-gray-300 rounded-lg p-4 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={address.address_line1}
                onChange={e =>
                  handleAddressChange(index, 'address_line1', e.target.value)
                }
                className={clsx(
                  'w-full p-2 border rounded',
                  errors.addresses?.[index]?.address_line1
                    ? 'border-red-500'
                    : 'border-gray-300',
                )}
              />
              {errors.addresses?.[index]?.address_line1 && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.addresses[index].address_line1}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={address.address_line2}
                onChange={e =>
                  handleAddressChange(index, 'address_line2', e.target.value)
                }
                className={clsx(
                  'w-full p-2 border rounded',
                  errors.addresses?.[index]?.address_line2
                    ? 'border-red-500'
                    : 'border-gray-300',
                )}
              />
              {errors.addresses?.[index]?.address_line2 && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.addresses[index].address_line2}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={address.city}
                onChange={e =>
                  handleAddressChange(index, 'city', e.target.value)
                }
                className={clsx(
                  'w-full p-2 border rounded',
                  errors.addresses?.[index]?.city
                    ? 'border-red-500'
                    : 'border-gray-300',
                )}
              />
              {errors.addresses?.[index]?.city && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.addresses[index].city}
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
                  handleAddressChange(index, 'state', e.target.value)
                }
                className={clsx(
                  'w-full p-2 border rounded',
                  errors.addresses?.[index]?.state
                    ? 'border-red-500'
                    : 'border-gray-300',
                )}
              />
              {errors.addresses?.[index]?.state && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.addresses[index].state}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={address.postal_code}
                onChange={e =>
                  handleAddressChange(index, 'postal_code', e.target.value)
                }
                className={clsx(
                  'w-full p-2 border rounded',
                  errors.addresses?.[index]?.postal_code
                    ? 'border-red-500'
                    : 'border-gray-300',
                )}
              />
              {errors.addresses?.[index]?.postal_code && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.addresses[index].postal_code}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="danger"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  addresses: prev.addresses.filter((_, i) => i !== index),
                }));
              }}
            >
              Delete Address
            </Button>
          </div>
        </div>
      ))}
      <div className="flex justify-center">
        <Button variant="primary" onClick={handleAddAddress}>
          Add Address
        </Button>
      </div>
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={clsx(
              'w-full p-2 border rounded',
              errors.first_name ? 'border-red-500' : 'border-gray-300',
            )}
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Middle Name
          </label>
          <input
            type="text"
            name="middle_name"
            value={formData.middle_name || ''}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={clsx(
              'w-full p-2 border rounded',
              errors.last_name ? 'border-red-500' : 'border-gray-300',
            )}
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className={clsx(
              'w-full p-2 border rounded',
              errors.date_of_birth ? 'border-red-500' : 'border-gray-300',
            )}
          />
          {errors.date_of_birth && (
            <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Visit
          </label>
          <input
            type="date"
            name="last_visit"
            value={formData.last_visit || ''}
            onChange={handleChange}
            className={clsx(
              'w-full p-2 border rounded',
              errors.last_visit ? 'border-red-500' : 'border-gray-300',
            )}
          />
          {errors.last_visit && (
            <p className="mt-1 text-sm text-red-600">{errors.last_visit}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={clsx(
              'w-full p-2 border rounded',
              errors.status ? 'border-red-500' : 'border-gray-300',
            )}
          >
            <option value="inquiry">Inquiry</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="churned">Churned</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-4">{renderAddresses()}</div>
    </div>
  );

  const renderSleepTracking = () => {
    const chartData = formData.isi_scores
      .filter(score => score.score !== undefined && score.date !== undefined)
      .map(({ date, score }) => ({
        x: date,
        y: score as number,
      }));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">ISI Scores</h3>
        </div>

        <div className="h-64">
          <LineChart data={chartData} />
        </div>

        <div className="space-y-4">
          {formData.isi_scores.map((score, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-4 p-4 border rounded"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score
                </label>
                <input
                  type="number"
                  value={score.score ?? ''}
                  onChange={e => {
                    const newScores = [...formData.isi_scores];
                    newScores[index] = {
                      ...newScores[index],
                      score:
                        e.target.value === ''
                          ? undefined
                          : parseInt(e.target.value),
                    };
                    setFormData(prev => ({ ...prev, isi_scores: newScores }));
                  }}
                  className={clsx(
                    'w-full p-2 border rounded',
                    errors.isi_scores?.[index]
                      ? 'border-red-500'
                      : 'border-gray-300',
                  )}
                />
                {errors.isi_scores?.[index] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.isi_scores[index]}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={score.date}
                    onChange={e => {
                      const newScores = [...formData.isi_scores];
                      newScores[index] = {
                        ...newScores[index],
                        date: e.target.value,
                      };
                      setFormData(prev => ({ ...prev, isi_scores: newScores }));
                    }}
                    className={clsx(
                      'w-full p-2 border rounded',
                      errors.isi_scores?.[index]
                        ? 'border-red-500'
                        : 'border-gray-300',
                    )}
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteISIScore(index)}
                    className="whitespace-nowrap"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-center pb-6">
            <Button
              variant="outline"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  isi_scores: [
                    ...prev.isi_scores,
                    {
                      id: null,
                      score: undefined,
                      date: new Date().toISOString().split('T')[0],
                    },
                  ],
                }));
              }}
            >
              Add Score
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderAdditionalInfo = () => (
    <div className="space-y-6">
      <div className="text-gray-500">
        Additional information form fields will be configurable here.
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none">
        <div className="pb-4">
          <nav className="-mb-px flex space-x-8 pb-4">
            <button
              onClick={() => setActiveTab('basic')}
              className={clsx(
                'py-2 px-1 border-b-2 font-medium text-sm cursor-pointer',
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              General Information
            </button>
            <button
              onClick={() => setActiveTab('sleep')}
              className={clsx(
                'py-2 px-1 border-b-2 font-medium text-sm cursor-pointer',
                activeTab === 'sleep'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              Sleep Tracking
            </button>
            <button
              onClick={() => setActiveTab('additional')}
              className={clsx(
                'py-2 px-1 border-b-2 font-medium text-sm cursor-pointer',
                activeTab === 'additional'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              Additional Information
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto pr-2">
        {activeTab === 'basic' && renderBasicInfo()}
        {activeTab === 'sleep' && renderSleepTracking()}
        {activeTab === 'additional' && renderAdditionalInfo()}
      </div>

      <div className="flex-none border-t border-gray-200 bg-white">
        <div className="pt-6 flex justify-between space-x-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
