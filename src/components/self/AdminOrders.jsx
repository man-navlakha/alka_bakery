import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Context/apiFetch";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    apiFetch("http://localhost:3000/api/orders")
      .then(setOrders)
      .catch(console.error);
  }, []);

  const handleUpdateStatus = async (orderId, status) => {
    await apiFetch(`http://localhost:3000/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-4">Admin Orders</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">Order ID</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td className="border p-2">{order.id}</td>
              <td className="border p-2">₹{order.total}</td>
              <td className="border p-2">{order.status}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleUpdateStatus(order.id, "Completed")} className="bg-green-500 text-white px-2 py-1 rounded">Complete</button>
                <button onClick={() => handleUpdateStatus(order.id, "Cancelled")} className="bg-red-500 text-white px-2 py-1 rounded">Cancel</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
