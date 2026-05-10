'use client';

import { SearchForm } from './search-form';
import { FeatureTags } from './feature-tags';

export function HeroSection() {
  return (
    <section className="relative w-full pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-blue-600/40" />
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-5% w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-5% w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -z-10" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {/* Subtitle */}
          <p className="text-blue-100 text-sm md:text-base font-medium mb-4">
            Về xe khách liên tỉnh
          </p>

          {/* Main Heading */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance leading-tight">
            Tìm chuyến xe nhanh, giá tốt mỗi ngày
          </h1>

          {/* Description */}
          <p className="text-blue-50 text-base md:text-lg max-w-2xl mx-auto mb-12">
            Chọn tỉnh/thành từ đủ liệu thất trong bảng{' '}
            <span className="font-semibold text-white">cities</span> để tìm chuyến xe chính xác hơn.
          </p>
        </div>

        {/* Search Form */}
        <div className="flex justify-center mb-8">
          <SearchForm />
        </div>

        {/* Feature Tags */}
        <FeatureTags />
      </div>
    </section>
  );
}
