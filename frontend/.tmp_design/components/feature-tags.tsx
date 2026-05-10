'use client';

import { CreditCard, Headphones, Zap } from 'lucide-react';

export function FeatureTags() {
  const features = [
    {
      icon: CreditCard,
      label: 'Không phí đặt chỗ',
      description: 'No prepayment',
    },
    {
      icon: Headphones,
      label: 'Hỗ trợ 24/7',
      description: '24/7 Support',
    },
    {
      icon: Zap,
      label: 'Xác nhận tức thì',
      description: 'Instant confirmation',
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={index}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-400/20 backdrop-blur-sm text-blue-100 text-sm font-medium border border-blue-300/30 hover:bg-blue-400/30 transition-colors"
          >
            <Icon className="w-4 h-4" />
            <span>{feature.label}</span>
          </div>
        );
      })}
    </div>
  );
}
