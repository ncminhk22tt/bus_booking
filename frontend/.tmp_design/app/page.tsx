import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero-section';

export const metadata = {
  title: 'vexeClone - Tìm chuyến xe nhanh, giá tốt mỗi ngày',
  description:
    'Đặt vé xe khách liên tỉnh nhanh chóng, an toàn và giá tốt nhất. Không phí đặt chỗ, hỗ trợ 24/7.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <HeroSection />
    </main>
  );
}
