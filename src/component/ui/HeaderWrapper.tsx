// component/ui/HeaderWrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import EnhancedHeader from '../layoutWrapper/header/Header';

export default function HeaderWrapper() {
  const pathname = usePathname();

  // Don't show header on login page
  if (pathname === '/login/' || pathname === '/login') {
    return null;
  }

  // Header is shown on both Smith and Gift Voucher screens;
  // the Smith-only nav items and Logout are gated inside EnhancedHeader itself.
  return <EnhancedHeader />;
}