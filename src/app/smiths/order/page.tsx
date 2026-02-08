// src/pages/orders.tsx

'use client';
import ProtectedRoute from '@/component/Layout/ProtectedRoute';
import SmithOrders from '@/component/pages/orders/SmithOrders';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth/AuthContext';



// app/smiths/order/page.tsx




export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <ProtectedRoute><SmithOrders /></ProtectedRoute>;
}