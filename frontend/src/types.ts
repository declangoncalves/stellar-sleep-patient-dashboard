export interface Address {
  id: number | null;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
}

export interface AddressError {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}
