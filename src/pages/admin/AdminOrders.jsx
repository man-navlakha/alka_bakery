import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Context/apiFetch";
import { Loader2, Package, CheckCircle, XCircle, Clock, Truck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  processing: { color: "bg-blue-100 text-blue-800", icon: Loader2 },
  shipped: { color: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); // For detailed view modal
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch Orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_BASE}/api/admin/orders`); // Assuming you added this route
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update Status Handler
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await apiFetch(`${API_BASE}/api/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      
      toast.success(`Order marked as ${newStatus}`);
      
      // Optimistic UI update
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fmt = (n) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;
  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Order Management</h1>
        <Button variant="outline" onClick={fetchOrders} disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-stone-400" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 rounded-xl border border-stone-200">
          <Package className="w-12 h-12 mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500">No orders found.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order) => {
                  const StatusIcon = statusConfig[order.status]?.icon || AlertCircle;
                  return (
                    <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-stone-500">#{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-stone-800">{order.address_snapshot?.recipient_name || "Unknown"}</div>
                        <div className="text-xs text-stone-500">{order.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-stone-900">{fmt(order.grand_total)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-stone-700">{order.payment_method}</span>
                          <span className={`text-[10px] font-bold uppercase ${order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                            {order.payment_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusConfig[order.status]?.color || "bg-gray-100 text-gray-800"}`}>
                          <StatusIcon size={12} /> {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>View</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] mt-18 overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between mr-8">
                  <span>Order #{selectedOrder.id.slice(0, 8)}</span>
                  <span className={`text-xs px-3 py-1 rounded-full ${statusConfig[selectedOrder.status]?.color}`}>
                    {selectedOrder.status.toUpperCase()}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Customer & Address */}
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-lg border border-stone-100">
                    <div>
                        <p className="text-xs font-bold text-stone-400 uppercase mb-1">Customer</p>
                        <p className="font-bold text-stone-800">{selectedOrder.address_snapshot?.recipient_name}</p>
                        <p className="text-sm text-stone-600">{selectedOrder.address_snapshot?.recipient_phone}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-stone-400 uppercase mb-1">Shipping Address</p>
                        <p className="text-sm text-stone-600 leading-relaxed">
                            {selectedOrder.address_snapshot?.house_no}, {selectedOrder.address_snapshot?.street_address}<br/>
                            {selectedOrder.address_snapshot?.city}, {selectedOrder.address_snapshot?.state} - {selectedOrder.address_snapshot?.pincode}
                        </p>
                    </div>
                </div>

                {/* Items */}
                <div>
                    <p className="text-xs font-bold text-stone-400 uppercase mb-3">Order Items</p>
                    <div className="space-y-3">
                        {selectedOrder.order_items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-stone-100 pb-2 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="bg-stone-100 w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-stone-600">
                                        {item.quantity}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-stone-800">{item.product_name || "Product"}</p>
                                        <p className="text-xs text-stone-500">
                                            {item.unit === 'gm' ? `${item.grams}g` : item.variant_label || item.unit}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-stone-900">{fmt(item.line_total)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment */}
                <div className="flex justify-end border-t border-stone-100 pt-4">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                        <div className="flex justify-between text-stone-500"><span>Subtotal</span><span>{fmt(selectedOrder.subtotal)}</span></div>
                        <div className="flex justify-between text-stone-500"><span>Delivery</span><span>{fmt(selectedOrder.delivery_fee)}</span></div>
                        {selectedOrder.discount_amount > 0 && (
                             <div className="flex justify-between text-green-600"><span>Discount</span><span>-{fmt(selectedOrder.discount_amount)}</span></div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-stone-900 pt-2 border-t border-stone-200">
                            <span>Total</span><span>{fmt(selectedOrder.grand_total)}</span>
                        </div>
                    </div>
                </div>

                {/* Admin Actions */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 space-y-3">
                    <p className="text-xs font-bold text-orange-800 uppercase">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                            <Button 
                                key={status}
                                size="sm" 
                                variant={selectedOrder.status === status ? "default" : "outline"}
                                className={selectedOrder.status === status ? "bg-stone-800" : "bg-white hover:bg-orange-100 border-orange-200 text-stone-600"}
                                onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                                disabled={updatingStatus}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}