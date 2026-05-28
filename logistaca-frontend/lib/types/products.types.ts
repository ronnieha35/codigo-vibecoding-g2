export interface ProductList {
  id: number
  name: string
  sku: string
  category: string
  unit_price: number
  stock_quantity: number
  is_active: boolean
}

export interface ProductDetail {
  id: number
  supplier_id: number
  warehouse_id: number | null
  name: string
  sku: string
  description: string
  category: string
  unit_price: number
  weight_kg: number
  length_cm: number
  width_cm: number
  height_cm: number
  stock_quantity: number
  is_active: boolean
  supplier: { id: number; name: string }
  warehouse: { id: number; name: string; city: string } | null
  created_at: string
  updated_at: string
}

export interface ProductWrite {
  supplier_id: number
  warehouse_id?: number | null
  name: string
  sku: string
  description: string
  category: string
  unit_price: number
  weight_kg: number
  length_cm: number
  width_cm: number
  height_cm: number
  stock_quantity: number
  is_active: boolean
}
