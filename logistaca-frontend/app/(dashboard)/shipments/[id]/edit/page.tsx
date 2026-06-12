'use client'

import { useParams } from 'next/navigation'
import ShipmentFormPage from '@/components/shipments/ShipmentFormPage'

export default function EditShipmentPage() {
  const params = useParams()
  return <ShipmentFormPage shipmentId={Number(params.id)} />
}
