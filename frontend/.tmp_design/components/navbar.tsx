'use client';

import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-blue-100/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold text-blue-600">vexeClone</span>
          </div>

          {/* Center - Search Button */}
          <div className="hidden md:flex">
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Tìm chuyến
            </Button>
          </div>

          {/* Right - Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Đăng nhập
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6">
              Đăng ký
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
