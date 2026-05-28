export interface SupplierList {
  id: number
  name: string
  email: string
  tax_id: string
  is_active: boolean
}

export interface SupplierDetail {
  id: number
  name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id: string
  contact_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierWrite {
  name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id: string
  contact_name: string
  is_active: boolean
}
