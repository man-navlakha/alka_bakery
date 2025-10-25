import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AdminDashboard() {
  // In a real app, you might fetch summary data here (e.g., total orders, new messages)
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Welcome to the Alka Bakery Admin Panel.</p>
            <p className="mt-2">Use the sidebar to manage products and orders.</p>
          </CardContent>
        </Card>
        {/* Add more summary cards here */}
         <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             <a href="/admin/products" className="block text-blue-600 hover:underline">Manage Products</a>
             <a href="/admin/orders" className="block text-blue-600 hover:underline">View Orders</a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}