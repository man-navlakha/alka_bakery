import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './Context/AuthProvider';
import { Loader2 } from 'lucide-react'; // For loading state

// Layout for the Admin Panel
const AdminLayout = () => (
  <div className="flex min-h-screen">
    {/* Basic Sidebar */}
    <nav className="w-48 bg-gray-800 text-white p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <ul className="space-y-2 flex-grow">
        <li><a href="/admin/dashboard" className="block py-1 px-2 rounded hover:bg-gray-700 hover:text-pink-300 transition-colors">Dashboard</a></li>
        <li><a href="/admin/products" className="block py-1 px-2 rounded hover:bg-gray-700 hover:text-pink-300 transition-colors">Products</a></li>
        <li><a href="/admin/categories" className="block py-1 px-2 rounded hover:bg-gray-700 hover:text-pink-300 transition-colors">Categories</a></li>
        <li><a href="/admin/units" className="block py-1 px-2 rounded hover:bg-gray-700 hover:text-pink-300 transition-colors">Units</a></li>
        <li><a href="/admin/orders" className="block py-1 px-2 rounded hover:bg-gray-700 hover:text-pink-300 transition-colors">Orders</a></li>
      </ul>
      {/* Optional: Add Logout button or user info at the bottom */}
      <div className="mt-auto">
        <a href="/" className="block py-1 px-2 text-sm text-gray-400 hover:text-white">Back to Shop</a>
      </div>
    </nav>
    {/* Main Content Area */}
    <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
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