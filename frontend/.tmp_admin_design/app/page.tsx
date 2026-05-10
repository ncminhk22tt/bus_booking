'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin-layout'

export default function Home() {
  const [activeSection, setActiveSection] = useState<'xe' | 'tuyen' | 'chuyen' | 'booking'>('xe')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection} />
    </div>
  )
}
