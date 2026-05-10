'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'

export default function TripForm() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-orange-100">
        <CardTitle className="text-2xl">Quản lý chuyến xe</CardTitle>
        <CardDescription>Tạo và quản lý các chuyến xe</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="trip-route">Tuyến</FieldLabel>
              <Input id="trip-route" placeholder="Chọn tuyến" />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="trip-date">Ngày khởi hành</FieldLabel>
              <Input id="trip-date" type="date" />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="trip-time">Giờ khởi hành</FieldLabel>
              <Input id="trip-time" type="time" />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="trip-vehicle">Xe</FieldLabel>
              <Input id="trip-vehicle" placeholder="Chọn xe" />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="trip-driver">Tài xế</FieldLabel>
              <Input id="trip-driver" placeholder="Nhập tên tài xế" />
            </Field>
          </FieldGroup>

          <Button className="w-full bg-orange-600 hover:bg-orange-700">Tạo chuyến</Button>
        </div>
      </CardContent>
    </Card>
  )
}
