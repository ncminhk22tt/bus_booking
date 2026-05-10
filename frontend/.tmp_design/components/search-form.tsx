'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

const CITIES = [
  'Hà Nội',
  'Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Nha Trang',
];

export function SearchForm() {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('2026-03-19');

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-blue-500/20 p-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Departure */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nơi đi
          </label>
          <Select value={departure} onValueChange={setDeparture}>
            <SelectTrigger className="w-full border-gray-200 rounded-xl focus:ring-blue-500 focus:border-transparent">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <SelectValue placeholder="Chọn tỉnh/thành đi" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Destination */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nơi đến
          </label>
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger className="w-full border-gray-200 rounded-xl focus:ring-blue-500 focus:border-transparent">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <SelectValue placeholder="Chọn tỉnh/thành đến" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày đi
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-blue-500 z-10" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-9 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="md:col-span-1 flex items-end">
          <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl py-2 h-11 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300">
            <ArrowRight className="w-4 h-4 mr-2" />
            Tìm chuyến
          </Button>
        </div>
      </div>
    </div>
  );
}
