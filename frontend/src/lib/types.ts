// Base types
export interface Address {
  id: string | number | null;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  created_at?: string;
  updated_at?: string;
}

export interface ISIScore {
  id: string | number | null;
  score: number;
  date: string;
}

export interface CustomField {
  id: string;
  name: string;
  required: boolean;
}

export interface CustomFieldValue {
  id: string | number | null;
  field_definition: string;
  value: string;
}

// Patient related types
export interface Patient {
  id: string | number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  status: 'inquiry' | 'onboarding' | 'active' | 'churned';
  last_visit: string | null;
  addresses: Address[];
  ready_to_discharge: boolean;
  isi_scores: ISIScore[];
  custom_field_values: CustomFieldValue[];
  created_at: string;
  updated_at: string;
}

// Form related types
export interface ValidationError {
  [key: string]: string;
}

export interface AddressError {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface ValidationErrors {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  status?: string;
  addresses?: { [key: number]: AddressError };
  isi_scores?: { [key: number]: string };
  custom_fields?: { [key: number]: string };
}

// API specific types
export type AddressWithNullableId = Omit<Address, 'id'> & {
  id: string | number | null;
};
export type ISIScoreWithNullableId = Omit<ISIScore, 'id'> & {
  id: string | number | null;
};

export interface PatientData {
  id?: string | number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  status: string;
  last_visit: string | null;
  addresses: AddressWithNullableId[];
  isi_scores: ISIScoreWithNullableId[];
  custom_field_values: CustomFieldValue[];
  created_at?: string;
  updated_at?: string;
  ready_to_discharge?: boolean;
}

// Form context types
export interface PatientFormData extends Omit<Patient, 'id'> {
  id: string | number;
}

export interface PatientFormContextType {
  formData: PatientFormData;
  errors: ValidationErrors;
  customFields: CustomField[];
  updateField: (
    field: keyof PatientFormData,
    value: string | number | Array<CustomFieldValue | ISIScore | Address>,
  ) => void;
  updateAddress: (index: number, field: string, value: string) => void;
  addAddress: () => void;
  removeAddress: (index: number) => void;
  updateISIScore: (
    index: number,
    field: 'score' | 'date',
    value: number | string,
  ) => void;
  addISIScore: () => void;
  removeISIScore: (index: number) => void;
  updateCustomField: (index: number, value: string) => void;
  addCustomField: (field: CustomField) => void;
  removeCustomField: (index: number) => void;
  validateForm: () => boolean;
  save: () => Promise<void>;
  reset: () => void;
}
