import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './Context/AuthProvider';
import { Loader2 } from 'lucide-react'; // For loading state

// Layout for the Admin Panel
const AdminLayout = () => (
  <div className="flex min-h-screen">
    {/* Basic Sidebar */}
    <nav className="w-48 bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <ul>
        <li className="mb-2"><a href="/admin/dashboard" className="hover:text-pink-300">Dashboard</a></li>
        <li className="mb-2"><a href="/admin/products" className="hover:text-pink-300">Products</a></li>
        <li className="mb-2"><a href="/admin/orders" className="hover:text-pink-300">Orders</a></li>
      </ul>
      {/* Add Logout button if needed */}
    </nav>
    {/* Main Content Area */}
    <main className="flex-1 p-6 bg-gray-100">
      <Outlet /> {/* Child routes will render here */}
    </main>
  </div>
);


export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        <p className="ml-2 text-zinc-600">Checking access...</p>
      </div>
    );
  }

  // Check if user exists and has admin role
  if (!user || user.role !== 'admin') {
    // Redirect non-admins to the home page or login page
    return <Navigate to="/" replace />;
  }

  // If user is admin, render the AdminLayout which contains the Outlet for nested routes
  return <AdminLayout />;
}