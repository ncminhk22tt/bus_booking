'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'

export default function RouteForm() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
        <CardTitle className="text-2xl">Quản lý tuyến đường</CardTitle>
        <CardDescription>Tạo và quản lý các tuyến đường vận chuyển</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="route-name">Tên tuyến</FieldLabel>
              <Input id="route-name" placeholder="VD: Hà Nội - Hải Phòng" />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="start-point">Điểm đi</FieldLabel>
              <Input id="start-point" placeholder="Nhập địa điểm bắt đầu" />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="end-point">Điểm đến</FieldLabel>
              <Input id="end-point" placeholder="Nhập địa điểm kết thúc" />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="distance">Khoảng cách (km)</FieldLabel>
              <Input id="distance" type="number" placeholder="Nhập khoảng cách" />
            </Field>
          </FieldGroup>

          <Button className="w-full bg-purple-600 hover:bg-purple-700">Tạo tuyến</Button>
        </div>
      </CardContent>
    </Card>
  )
}
