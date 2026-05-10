'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const bookings = [
  {
    id: 'BK001',
    passengerName: 'Nguyễn Văn A',
    phone: '0901234567',
    route: 'Hà Nội - Hải Phòng',
    date: '2024-03-20',
    seats: '5',
    status: 'confirmed',
    statusText: 'Xác nhận',
  },
  {
    id: 'BK002',
    passengerName: 'Trần Thị B',
    phone: '0912345678',
    route: 'Hà Nội - Hà Nam',
    date: '2024-03-20',
    seats: '2',
    status: 'pending',
    statusText: 'Chờ xác nhận',
  },
  {
    id: 'BK003',
    passengerName: 'Lê Văn C',
    phone: '0923456789',
    route: 'Hà Nội - Hải Dương',
    date: '2024-03-21',
    seats: '3',
    status: 'confirmed',
    statusText: 'Xác nhận',
  },
]

export default function BookingList() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-cyan-50 to-cyan-100">
        <CardTitle className="text-2xl">Danh sách đặt vé</CardTitle>
        <CardDescription>Tổng cộng {bookings.length} đơn đặt vé</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Khách hàng</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Tuyến</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Ngày</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Ghế</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-600">{booking.id}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-slate-900">{booking.passengerName}</p>
                      <p className="text-xs text-slate-500">{booking.phone}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{booking.route}</td>
                  <td className="py-3 px-4 text-slate-600">{booking.date}</td>
                  <td className="py-3 px-4 text-slate-600">{booking.seats}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                    >
                      {booking.statusText}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
