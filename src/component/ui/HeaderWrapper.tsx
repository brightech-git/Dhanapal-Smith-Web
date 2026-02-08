// component/ui/HeaderWrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import EnhancedHeader from './EnhancedHeader';

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Don't show header on login page
  if (pathname === '/login/') {
    return null;
  }
  
  return <EnhancedHeader />;
}