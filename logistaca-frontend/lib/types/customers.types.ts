export type CustomerType = 'PERSON' | 'COMPANY'

export interface CustomerList {
  id: number
  name: string
  customer_type: CustomerType
  email: string
  city: string
  is_active: boolean
}

export interface CustomerDetail {
  id: number
  user_id: number | null
  name: string
  customer_type: CustomerType
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerWrite {
  user_id?: number | null
  name: string
  customer_type: CustomerType
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id?: string | null
  is_active: boolean
}
