'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

const sampleVehicles = [
  {
    id: 1,
    name: 'Xe Seed',
    licensePlate: 'SEED-17736070292|3',
    type: 'Bus 16 chỗ',
    status: 'danger',
    statusText: 'Ngừng hoạt động',
  },
  {
    id: 2,
    name: 'Xe Thủ Đô',
    licensePlate: '29A-12345',
    type: 'Bus 32 chỗ',
    status: 'success',
    statusText: 'Hoạt động',
  },
  {
    id: 3,
    name: 'Xe An Tâm',
    licensePlate: '29B-67890',
    type: 'Minibus 6 chỗ',
    status: 'success',
    statusText: 'Hoạt động',
  },
]

export default function VehicleList() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-green-50 to-green-100">
        <CardTitle className="text-xl">Danh sách xe</CardTitle>
        <CardDescription>Tổng cộng {sampleVehicles.length} xe trong hệ thống</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {sampleVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">
                    #{vehicle.id} - {vehicle.name}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">Biển số: {vehicle.licensePlate}</p>
                  <p className="text-sm text-slate-500">Loại: {vehicle.type}</p>
                </div>
                <Badge
                  variant={vehicle.status === 'danger' ? 'destructive' : 'default'}
                  className="whitespace-nowrap"
                >
                  {vehicle.status === 'danger' && <AlertCircle className="w-3 h-3 mr-1" />}
                  {vehicle.statusText}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
