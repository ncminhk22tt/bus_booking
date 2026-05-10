'use client'

import { Car, Route, MapPin, Calendar } from 'lucide-react'
import VehicleForm from './sections/vehicle-form'
import VehicleList from './sections/vehicle-list'
import RouteForm from './sections/route-form'
import TripForm from './sections/trip-form'
import BookingList from './sections/booking-list'
import AdminSidebarCard from './admin-sidebar-card'

type Section = 'xe' | 'tuyen' | 'chuyen' | 'booking'

interface AdminLayoutProps {
  activeSection: Section
  onSectionChange: (section: Section) => void
}

const adminMenuItems = [
  {
    id: 'xe',
    label: 'Quản lý xe',
    icon: Car,
    description: 'Tạo và quản lý thông tin xe',
  },
  {
    id: 'tuyen',
    label: 'Quản lý tuyến',
    icon: Route,
    description: 'Quản lý các tuyến đường',
  },
  {
    id: 'chuyen',
    label: 'Quản lý chuyến',
    icon: MapPin,
    description: 'Quản lý các chuyến xe',
  },
  {
    id: 'booking',
    label: 'Quản lý booking',
    icon: Calendar,
    description: 'Xem danh sách đặt vé',
  },
]

export default function AdminLayout({ activeSection, onSectionChange }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Trái */}
      <aside className="w-72 p-6 space-y-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Bảng điều khiển quản trị</p>
        </div>

        <nav className="space-y-3">
          {adminMenuItems.map((item) => (
            <AdminSidebarCard
              key={item.id}
              isActive={activeSection === item.id}
              onClick={() => onSectionChange(item.id as Section)}
              label={item.label}
              description={item.description}
              icon={item.icon}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl">
          {activeSection === 'xe' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <VehicleForm />
              <VehicleList />
            </div>
          )}
          {activeSection === 'tuyen' && <RouteForm />}
          {activeSection === 'chuyen' && <TripForm />}
          {activeSection === 'booking' && <BookingList />}
        </div>
      </main>
    </div>
  )
}
