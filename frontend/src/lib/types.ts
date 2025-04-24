export interface Address {
  id: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Patient {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  status: 'inquiry' | 'onboarding' | 'active' | 'churned';
  addresses: Address[];
}
