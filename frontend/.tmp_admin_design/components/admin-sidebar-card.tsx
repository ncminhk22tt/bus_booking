'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarCardProps {
  label: string
  description: string
  icon: LucideIcon
  isActive: boolean
  onClick: () => void
}

export default function AdminSidebarCard({
  label,
  description,
  icon: Icon,
  isActive,
  onClick,
}: AdminSidebarCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md',
        isActive
          ? 'bg-blue-50 border-blue-500 shadow-md'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            'w-5 h-5 mt-0.5 flex-shrink-0',
            isActive ? 'text-blue-600' : 'text-slate-400'
          )}
        />
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-semibold text-sm',
              isActive ? 'text-blue-900' : 'text-slate-900'
            )}
          >
            {label}
          </h3>
          <p
            className={cn(
              'text-xs mt-1 line-clamp-2',
              isActive ? 'text-blue-700' : 'text-slate-500'
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}
