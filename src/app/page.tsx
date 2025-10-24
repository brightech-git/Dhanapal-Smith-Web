'use client';
import ProtectedRoute from "@/component/Layout/ProtectedRoute";
import SmithsPage from "@/component/pages/home/Home";

export default function Home() {
 
  return (

    <div > 
      <  ProtectedRoute>
          <SmithsPage />
      </ProtectedRoute>
    </div>

  );
}