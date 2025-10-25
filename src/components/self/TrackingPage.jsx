import React, { useState, useEffect } from "react";

export default function TrackingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/orders/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (loading) return <p className="text-center py-10">Loading orders...</p>;
  if (orders.length === 0) return <p className="text-center py-10">No orders found.</p>;

  const statuses = ["Processing", "Preparing", "Out for Delivery", "Completed"];

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-center">My Orders</h2>
      {orders.map((order) => (
        <div key={order.id} className="border rounded-xl p-4 shadow space-y-2">
          <p><span className="font-semibold">Order ID:</span> {order.id}</p>
          <p><span className="font-semibold">Total:</span> ₹{order.total}</p>
          <p><span className="font-semibold">Address:</span> {order.address}</p>
          <div className="flex items-center space-x-4 mt-2">
            {statuses.map((status) => (
              <span
                key={status}
                className={`px-3 py-1 rounded-full text-white text-sm ${
                  statuses.indexOf(status) <= statuses.indexOf(order.status)
                    ? "bg-pink-600"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {status}
              </span>
            ))}
          </div>

          <ul className="mt-2 border-t pt-2 space-y-1">
            {order.products.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.name} x {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
