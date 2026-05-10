'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'

export default function VehicleForm() {
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleName, setVehicleName] = useState('')
  const [licensePlate, setLicensePlate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log({ vehicleType, vehicleName, licensePlate })
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
        <CardTitle className="text-xl">Tạo xe mới</CardTitle>
        <CardDescription>Thêm thông tin xe vào hệ thống</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="vehicle-type">Loại xe</FieldLabel>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger id="vehicle-type">
                  <SelectValue placeholder="Chọn loại xe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bus">Bus 16 chỗ</SelectItem>
                  <SelectItem value="bus-32">Bus 32 chỗ</SelectItem>
                  <SelectItem value="minibus">Minibus 6 chỗ</SelectItem>
                  <SelectItem value="van">Van 9 chỗ</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="vehicle-name">Tên xe</FieldLabel>
              <Input
                id="vehicle-name"
                placeholder="Nhập tên xe"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="license-plate">Biển số</FieldLabel>
              <Input
                id="license-plate"
                placeholder="VD: 29A-12345"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Tạo xe
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
