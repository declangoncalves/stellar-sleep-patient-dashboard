'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  Patient,
  Address as AddressType,
  ISIScore,
  CustomFieldValue,
  PatientFormData,
  ValidationErrors,
  AddressError,
  CustomField,
  PatientData,
} from '@/lib/types';
import { patientsApi, ApiError } from '@/lib/api';

interface PatientFormContextType {
  formData: PatientFormData;
  errors: ValidationErrors;
  customFields: CustomField[];
  updateField: <T extends keyof PatientFormData>(
    field: T,
    value: PatientFormData[T],
  ) => void;
  updateAddress: (
    index: number,
    field: keyof AddressType,
    value: string,
  ) => void;
  addAddress: () => void;
  deleteAddress: (index: number) => void;
  updateISIScore: (
    index: number,
    field: keyof ISIScore,
    value: number | string,
  ) => void;
  deleteISIScore: (index: number) => void;
  addISIScore: () => void;
  updateCustomField: (values: CustomFieldValue[]) => void;
  addCustomField: (field: CustomField) => void;
  removeCustomField: (index: number) => void;
  validateForm: () => boolean;
  isSaving: boolean;
  save: () => Promise<void>;
}

const PatientFormContext = createContext<PatientFormContextType | null>(null);

interface PatientFormProviderProps {
  patient: Patient;
  onSaved: (updated: Patient) => void;
  children: ReactNode;
  isCreateMode?: boolean;
}

export function PatientFormProvider({
  patient,
  onSaved,
  children,
  isCreateMode,
}: PatientFormProviderProps) {
  const [formData, setFormData] = useState<PatientFormData>(() => ({
    ...patient,
    id: patient.id,
  }));

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const validateForm = useCallback((): boolean => {
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

    // Validate custom fields
    const customFieldErrors: { [key: number]: string } = {};
    formData.custom_field_values.forEach((field, index) => {
      const fieldDefinition = customFields.find(
        (f: CustomField) => f.id === field.field_definition,
      );
      if (fieldDefinition?.required && !field.value?.trim()) {
        customFieldErrors[index] = 'This field is required';
        isValid = false;
      }
    });
    if (Object.keys(customFieldErrors).length > 0) {
      newErrors.custom_fields = customFieldErrors;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, customFields]);

  const save = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const patientData: PatientData = {
        first_name: formData.first_name,
        middle_name: formData.middle_name || '',
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        status: formData.status,
        last_visit: formData.last_visit,
        addresses: formData.addresses,
        isi_scores: formData.isi_scores,
        custom_field_values: formData.custom_field_values,
      };

      let updatedPatient;
      if (isCreateMode) {
        updatedPatient = await patientsApi.createPatient(patientData);
      } else {
        updatedPatient = await patientsApi.updatePatient(
          formData.id.toString(),
          patientData,
        );
      }
      onSaved(updatedPatient);
    } catch (error) {
      console.error('Error saving patient:', error);
      // Handle API validation errors
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 400
      ) {
        const apiError = error as ApiError;
        const newErrors: ValidationErrors = {};

        // Map API errors to our error format
        Object.entries(apiError.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            newErrors[field as keyof ValidationErrors] = messages[0];
          }
        });

        setErrors(newErrors);
      }
    } finally {
      setIsSaving(false);
    }
  }, [formData, validateForm, onSaved, isCreateMode]);

  const updateField = useCallback(
    <T extends keyof PatientFormData>(field: T, value: PatientFormData[T]) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when field is modified
      if (field in errors) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    },
    [errors],
  );

  const updateAddress = useCallback(
    (index: number, field: keyof AddressType, value: string) => {
      setFormData(prev => ({
        ...prev,
        addresses: prev.addresses.map((address, i) =>
          i === index ? { ...address, [field]: value } : address,
        ),
      }));
    },
    [],
  );

  const addAddress = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          id: null,
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
        },
      ],
    }));
  }, []);

  const deleteAddress = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index),
    }));
  }, []);

  const updateISIScore = useCallback(
    (index: number, field: keyof ISIScore, value: number | string) => {
      setFormData(prev => ({
        ...prev,
        isi_scores: prev.isi_scores.map((score, i) =>
          i === index ? { ...score, [field]: value } : score,
        ),
      }));
    },
    [],
  );

  const addISIScore = useCallback(() => {
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
  }, []);

  const deleteISIScore = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      isi_scores: prev.isi_scores.filter((_, i) => i !== index),
    }));
  }, []);

  const updateCustomField = useCallback((values: CustomFieldValue[]) => {
    setFormData(prev => ({
      ...prev,
      custom_field_values: values,
    }));
  }, []);

  const addCustomField = useCallback((field: CustomField) => {
    setCustomFields(prev => [...prev, field]);
  }, []);

  const removeCustomField = useCallback((index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  }, []);

  const value = {
    formData,
    errors,
    customFields,
    updateField,
    updateAddress,
    addAddress,
    deleteAddress,
    updateISIScore,
    deleteISIScore,
    addISIScore,
    updateCustomField,
    addCustomField,
    removeCustomField,
    validateForm,
    isSaving,
    save,
  };

  return (
    <PatientFormContext.Provider value={value}>
      {children}
    </PatientFormContext.Provider>
  );
}

export function usePatientForm() {
  const context = useContext(PatientFormContext);
  if (!context) {
    throw new Error('usePatientForm must be used within a PatientFormProvider');
  }
  return context;
}
