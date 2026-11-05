// component/ui/HeaderWrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import EnhancedHeader from '@/src/components/app-shell/app-header';
import AppFooter from '@/src/components/app-shell/app-footer';

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
/** Footer on every screen except login (login shows its own branding). */
export function FooterWrapper() {
  const pathname = usePathname();
  if (pathname === '/login/' || pathname === '/login') return null;
  return <AppFooter />;
}
