'use client';

import { useState } from 'react';
import { Patient, Address, ISIScore } from '@/lib/types';
import axios from 'axios';
import clsx from 'clsx';
import { Button } from '@/components/Button/Button';

interface PatientInfoProps {
  patient: Patient;
  onSaved: (updated: Patient) => void;
  onClose: () => void;
  isCreateMode?: boolean;
}

interface FormData extends Omit<Patient, 'addresses' | 'isi_scores'> {
  addresses: (Address | (Omit<Address, 'id'> & { id: number | null }))[];
  isi_scores: (ISIScore | (Omit<ISIScore, 'id'> & { id: null }))[];
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
  isi_scores?: { [key: number]: string };
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
    ready_to_discharge: patient.ready_to_discharge || false,
    last_visit: patient.last_visit || null,
    addresses: patient.addresses || [],
    isi_scores: patient.isi_scores || [],
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
            ready_to_discharge: formData.ready_to_discharge,
          },
        );
        updatedPatient = response.data;
      } else {
        // Update existing patient
        await axios.put(`http://127.0.0.1:8000/api/patients/${formData.id}/`, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          date_of_birth: formData.date_of_birth,
          status: formData.status,
          ready_to_discharge: formData.ready_to_discharge,
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

        // Handle ISI scores
        for (const score of formData.isi_scores) {
          if (score.id === null) {
            // New score
            await axios.post('http://127.0.0.1:8000/api/isi-scores/', {
              patient: formData.id,
              score: score.score,
              date: score.date,
            });
          }
        }

        updatedPatient = {
          ...formData,
          addresses: formData.addresses.map(addr => ({
            ...addr,
            id: addr.id || 0,
          })),
          isi_scores: formData.isi_scores.map(score => ({
            ...score,
            id: score.id || 0,
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

  const handleDeleteISIScore = (scoreId: number) => {
    setFormData(prev => ({
      ...prev,
      isi_scores: prev.isi_scores.filter(score => score.id !== scoreId),
    }));
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
              className={`p-2 border rounded w-full text-black ${errors.last_name ? inputErrorClasses : ''}`}
              placeholder="Last name"
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
              name="date_of_birth"
              type="date"
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

        <div className="flex items-center">
          <input
            id="ready_to_discharge"
            name="ready_to_discharge"
            type="checkbox"
            checked={formData.ready_to_discharge}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                ready_to_discharge: e.target.checked,
              }))
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="ready_to_discharge"
            className="ml-2 block text-sm font-medium text-gray-700"
          >
            Ready to Discharge
          </label>
        </div>

        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium text-gray-900">ISI Scores</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.isi_scores?.map((score, index) => (
                  <tr key={score.id || `new-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="date"
                        value={score.date}
                        onChange={e => {
                          const updatedScores = [...formData.isi_scores];
                          updatedScores[index] = {
                            ...updatedScores[index],
                            date: e.target.value,
                          };
                          setFormData(prev => ({
                            ...prev,
                            isi_scores: updatedScores,
                          }));
                          // Clear error when field is modified
                          if (errors.isi_scores?.[index]) {
                            const newErrors = { ...errors };
                            delete newErrors.isi_scores?.[index];
                            if (
                              Object.keys(newErrors.isi_scores || {}).length ===
                              0
                            ) {
                              delete newErrors.isi_scores;
                            }
                            setErrors(newErrors);
                          }
                        }}
                        className={`mt-1 block w-full text-black rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 ${
                          errors.isi_scores?.[index]
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : ''
                        }`}
                      />
                      {errors.isi_scores?.[index] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.isi_scores[index]}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max="28"
                        value={score.score ?? ''}
                        onChange={e => {
                          const updatedScores = [...formData.isi_scores];
                          const newScore =
                            e.target.value === ''
                              ? null
                              : parseInt(e.target.value);
                          updatedScores[index] = {
                            ...updatedScores[index],
                            score: newScore === null ? undefined : newScore,
                          };
                          setFormData(prev => ({
                            ...prev,
                            isi_scores: updatedScores,
                          }));
                          // Clear error when field is modified
                          if (errors.isi_scores?.[index]) {
                            const newErrors = { ...errors };
                            delete newErrors.isi_scores?.[index];
                            if (
                              Object.keys(newErrors.isi_scores || {}).length ===
                              0
                            ) {
                              delete newErrors.isi_scores;
                            }
                            setErrors(newErrors);
                          }
                        }}
                        className={`mt-1 block w-full text-black rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 ${
                          errors.isi_scores?.[index]
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : ''
                        }`}
                      />
                      {errors.isi_scores?.[index] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.isi_scores[index]}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => {
                          if (score.id) {
                            handleDeleteISIScore(score.id);
                          } else {
                            const updatedScores = formData.isi_scores.filter(
                              (_, i) => i !== index,
                            );
                            setFormData(prev => ({
                              ...prev,
                              isi_scores: updatedScores,
                            }));
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          isi_scores: [
                            ...prev.isi_scores,
                            {
                              id: null,
                              score: 0,
                              date: new Date().toISOString().split('T')[0],
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            },
                          ],
                        }));
                      }}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add New Score
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 mt-6">
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

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
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
