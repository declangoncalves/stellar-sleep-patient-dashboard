export interface Address {
  id: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface ISIScore {
  id: number;
  score?: number;
  date: string;
}

export interface Patient {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  status: 'inquiry' | 'onboarding' | 'active' | 'churned';
  last_visit: string | null;
  addresses: Address[];
  created_at: string;
  updated_at: string;
  ready_to_discharge: boolean;
  isi_scores: ISIScore[];
}
