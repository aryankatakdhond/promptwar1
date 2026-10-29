import { Suspense } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F1EB]">
      <Suspense fallback={<div className="w-64 flex-shrink-0" style={{ background: '#1A1F2E' }} />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Suspense fallback={<div className="h-14 border-b" />}>
          <Header />
        </Suspense>
        <main className="flex-1 overflow-y-auto bg-[#F7F5F0] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
