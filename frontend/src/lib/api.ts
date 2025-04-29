import {
  CustomField,
  CustomFieldValue,
  Patient,
  PatientData,
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Extended Patient type with additional fields
export type ApiPatient = Patient;

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Patient[];
}

interface FetchPatientsParams {
  page: number;
  status?: string;
  city?: string;
  state?: string;
  search?: string;
  ordering?: string;
}

export interface ApiValidationError {
  [key: string]: string[];
}

export interface ApiError {
  status: number;
  errors: ApiValidationError;
}

/**
 * API functions for custom fields and related operations
 */
export const customFieldsApi = {
  /**
   * Fetch all custom fields from the API
   */
  fetchCustomFields: async (): Promise<CustomField[]> => {
    const res = await fetch(`${API_BASE_URL}/api/custom-fields/`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  },

  /**
   * Create a new custom field
   */
  createCustomField: async (name: string): Promise<CustomField> => {
    const res = await fetch(`${API_BASE_URL}/api/custom-fields/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        text.includes('already exists')
          ? `Field "${name}" already exists`
          : `Failed to create field: ${res.status}`,
      );
    }

    return res.json();
  },

  /**
   * Update a custom field value for a patient
   */
  updateCustomFieldValue: async (
    value: CustomFieldValue,
  ): Promise<CustomFieldValue> => {
    const res = await fetch(
      `${API_BASE_URL}/api/custom-field-values/${value.id ? value.id + '/' : ''}`,
      {
        method: value.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to update field value: ${res.status}`);
    }

    return res.json();
  },
};

/**
 * API functions for patients
 */
export const patientsApi = {
  /**
   * Fetch a single patient by ID
   */
  getPatient: async (id: string): Promise<ApiPatient> => {
    const res = await fetch(`${API_BASE_URL}/api/patients/${id}/`);
    if (!res.ok) throw new Error(`Failed to fetch patient: ${res.status}`);
    return res.json();
  },

  /**
   * Create a new patient
   */
  createPatient: async (patientData: PatientData): Promise<ApiPatient> => {
    const res = await fetch(`${API_BASE_URL}/api/patients/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });

    if (!res.ok) {
      if (res.status === 400) {
        const errorData = await res.json();
        throw { status: 400, errors: errorData } as ApiError;
      }
      throw new Error(`Failed to create patient: ${res.status}`);
    }

    return res.json();
  },

  /**
   * Update an existing patient
   */
  updatePatient: async (
    id: string,
    patientData: PatientData,
  ): Promise<ApiPatient> => {
    const res = await fetch(`${API_BASE_URL}/api/patients/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });

    if (!res.ok) {
      throw new Error(`Failed to update patient: ${res.status}`);
    }

    return res.json();
  },

  /**
   * Fetch paginated patients with filters
   */
  fetchPatients: async (
    params: FetchPatientsParams,
  ): Promise<{ patients: Patient[]; totalPages: number }> => {
    const { page, status, city, state, search, ordering } = params;

    const urlParams = new URLSearchParams({
      page: page.toString(),
      ...(status && { status }),
      ...(city && { city }),
      ...(state && { state }),
      ...(search && { search }),
      ...(ordering && { ordering }),
    });

    const res = await fetch(`${API_BASE_URL}/api/patients/?${urlParams}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch patients: ${res.status}`);
    }

    const data: PaginatedResponse = await res.json();

    // Deduplicate patients by ID
    const uniquePatients = data.results.reduce((acc: Patient[], patient) => {
      if (!acc.some(p => p.id.toString() === patient.id.toString())) {
        acc.push(patient);
      }
      return acc;
    }, []);

    return {
      patients: uniquePatients,
      totalPages: Math.ceil(data.count / 10),
    };
  },
};

// Utils for comparison and validation
export const utils = {
  /**
   * Deep equality check for custom field values arrays
   */
  areCustomFieldValuesEqual(
    a: CustomFieldValue[],
    b: CustomFieldValue[],
  ): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;

    const aMap = new Map(a.map(item => [item.field_definition, item.value]));

    for (const item of b) {
      if (aMap.get(item.field_definition) !== item.value) {
        return false;
      }
    }

    return true;
  },
};
