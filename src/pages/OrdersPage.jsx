// src/pages/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../Context/apiFetch";
import { Loader2, Package, MapPin, Calendar, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await apiFetch(`${API_BASE}/api/orders`);
        setOrders(data || []);
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const fmt = (n) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-IN", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin w-8 h-8 text-orange-600" /></div>;

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Your Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
            <Package className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-800">No orders yet</h3>
            <p className="text-stone-500 mb-6">Looks like you haven't baked any memories with us yet.</p>
            <Link to="/shop"><Button className="bg-orange-600 hover:bg-orange-700">Start Shopping</Button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="bg-stone-50 p-4 flex flex-wrap justify-between items-center gap-4 border-b border-stone-100">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Order #{order.id.slice(0, 8)}</p>
                    <div className="flex items-center gap-2 text-stone-700 text-sm">
                      <Calendar size={14} /> {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-stone-900">{fmt(order.grand_total)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  {/* Items */}
                  <div className="space-y-3 mb-6">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex gap-3">
                          <span className="font-bold text-stone-400">{item.quantity}x</span>
                          <span className="text-stone-800 font-medium">
                            {/* We don't store item name in DB yet perfectly, using ID fallback or name if you updated DB */}
                            {item.product_name || "Product"} 
                            <span className="text-stone-400 font-normal text-xs ml-1">
                              ({item.unit === 'gm' ? `${item.grams}g` : item.variant_label || item.unit})
                            </span>
                          </span>
                        </div>
                        <span className="text-stone-600">{fmt(item.line_total)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Info Footer */}
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="font-bold text-stone-900 mb-1 flex items-center gap-2"><MapPin size={14}/> Delivery To</p>
                      <p className="text-stone-600 leading-relaxed">
                        {order.address_snapshot.recipient_name}<br/>
                        {order.address_snapshot.house_no}, {order.address_snapshot.street_address}<br/>
                        {order.address_snapshot.city} - {order.address_snapshot.pincode}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-stone-600"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                      <div className="flex justify-between text-stone-600"><span>Delivery</span><span>{fmt(order.delivery_fee)}</span></div>
                      
                      {/* Show Saved Coupon Info */}
                      {order.coupon_code && (
                        <div className="flex justify-between text-green-700 font-medium bg-green-50 px-2 py-1 rounded text-xs">
                          <span className="flex items-center gap-1"><Tag size={12}/> {order.coupon_code}</span>
                          <span>-{fmt(order.discount_amount)}</span>
                        </div>
                      )}
                      {!order.coupon_code && order.discount_amount > 0 && (
                         <div className="flex justify-between text-green-700"><span>Discount</span><span>-{fmt(order.discount_amount)}</span></div>
                      )}
                      
                      <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-100 mt-2">
                        <span>Total Paid</span><span>{fmt(order.grand_total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}