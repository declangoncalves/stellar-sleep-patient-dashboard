export interface Patient {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  status: 'inquiry' | 'onboarding' | 'active' | 'churned';
  last_visit: string | null;
  addresses: Address[];
  ready_to_discharge?: boolean;
  isi_scores?: ISIScore[];
  custom_field_values?: CustomFieldValue[];
}

export interface Address {
  id: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
}

// export interface AddressError {
//   address_line1?: string;
//   address_line2?: string;
//   city?: string;
//   state?: string;
//   postal_code?: string;
// }

export interface ISIScore {
  id: number;
  score: number;
  date: string;
}

export interface CustomField {
  id: number;
  name: string;
  required?: boolean;
}

export interface CustomFieldValue {
  id: number;
  field_definition: number; // ID of the CustomField
  patient: number; // ID of the Patient
  value?: string;
}
