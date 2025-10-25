import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Context/apiFetch"; // Utility for authorized API calls
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

const orderStatuses = [
  "Processing",
  "Preparing",
  "Out for Delivery",
  "Completed",
  "Cancelled",
];

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch all orders (admin)
  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    try {
      // Now fetch from the ADMIN endpoint
      const data = await apiFetch("http://localhost:3000/api/orders/admin");

      // Sort orders by date (newest first)
      const sorted = data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setOrders(sorted);
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err);
      setError("Could not load orders. Please try again.");
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ✅ Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    const originalOrders = [...orders]; // optimistic UI
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const updatedOrder = await apiFetch(
        `http://localhost:3000/api/orders/${orderId}`,
        {
          method: "PUT",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      toast.success(`✅ Order ${orderId.slice(0, 6)} updated to ${newStatus}`);
    } catch (err) {
      console.error("❌ Failed to update order status:", err);
      toast.error(err.message || "Failed to update order status.");
      setOrders(originalOrders); // revert on error
    }
  };

  return (
    <div className="p-6">
      <Toaster richColors position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Orders</h1>
        <Button onClick={fetchOrders} variant="outline" size="sm" disabled={loading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          <p className="ml-2 text-zinc-600">Loading orders...</p>
        </div>
      )}

      {error && <p className="text-center py-10 text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          {orders.length > 0 ? (
            <table className="w-full min-w-[600px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Update Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {order.user?.name || order.user_id.slice(0, 8)}{" "}
                      <span className="text-gray-400 text-xs">
                        ({order.user?.email})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      ₹{order.total}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate"
                      title={order.address}
                    >
                      {order.address}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Cancelled"
                            ? "bg-red-100 text-red-800"
                            : order.status === "Out for Delivery"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "Preparing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleUpdateStatus(order.id, e.target.value)
                        }
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-1.5"
                        disabled={
                          order.status === "Completed" ||
                          order.status === "Cancelled"
                        }
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No orders found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
