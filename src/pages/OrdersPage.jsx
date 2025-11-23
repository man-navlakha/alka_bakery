// src/pages/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../Context/apiFetch";
import { Loader2, Package, MapPin, Calendar, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); // Store products for lookup
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch orders and products in parallel
        const [ordersData, productsData] = await Promise.all([
          apiFetch(`${API_BASE}/api/orders`),
          fetch(`${API_BASE}/api/products`).then((r) => r.json()),
        ]);

        setOrders(ordersData || []);
        setProducts(productsData || []);
      } catch (error) {
        console.error("Failed to load orders data", error);
        toast.error("Could not load orders");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Helper to lookup real product details from ID
  const getItemDetails = (orderItem) => {
    const product = products.find((p) => p.id === orderItem.product_id);

    // Name Fallback
    const name = product ? product.name : (orderItem.product_name || "Unknown Product");

    // Image Lookup
    let image = null;
    if (product) {
      if (product.product_images?.length > 0) image = product.product_images[0].url;
      else if (product.images?.length > 0) {
        image = typeof product.images[0] === "string" ? product.images[0] : product.images[0].url;
      } else if (product.image) image = product.image;
    }
    if (!image) image = "https://placehold.co/100x100?text=No+Img";

    // Variant Label Logic (Improved)
    let label = "";
    if (orderItem.unit === "gm") {
        // Fix for null grams in old orders
        label = orderItem.grams ? `${orderItem.grams}g` : "100g"; 
    }
    else if (orderItem.unit === "variant") label = orderItem.variant_label;
    else label = "Pc";

    return { name, image, label, category: product?.category };
  };

  const fmt = (n) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;
  
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Your Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Package className="w-10 h-10 text-stone-400" />
            </div>
            <h3 className="text-xl font-bold text-stone-800">No orders yet</h3>
            <p className="text-stone-500 mb-6 mt-2 max-w-xs mx-auto">
              Looks like you haven't baked any memories with us yet.
            </p>
            <Link to="/shop">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
              >
                {/* Header */}
                <div className="bg-stone-50/80 p-5 flex flex-wrap justify-between items-center gap-4 border-b border-stone-100">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      Order #{order.id.slice(0, 8)}
                    </div>
                    <div className="flex items-center gap-2 text-stone-700 font-medium text-sm">
                      <Calendar size={15} className="text-orange-600" /> 
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-serif font-bold text-stone-900">
                      {fmt(order.grand_total)}
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mt-1 ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  {/* Items List */}
                  <div className="space-y-4 mb-8">
                    {order.order_items.map((item) => {
                      const details = getItemDetails(item);
                      return (
                        <div key={item.id} className="flex gap-4 items-start group">
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden border border-stone-100 shrink-0">
                            <img 
                                src={details.image} 
                                alt={details.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                                <div>
                                    <h4 className="font-bold text-stone-800 text-sm line-clamp-1">
                                        {details.name}
                                    </h4>
                                    <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                                        <span>{details.category}</span>
                                        <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                                        <span>{details.label}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-stone-900 text-sm">{fmt(item.line_total)}</span>
                                </div>
                            </div>
                            <div className="mt-1 text-xs font-medium text-stone-600 bg-stone-50 inline-block px-2 py-0.5 rounded">
                                Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-6 bg-stone-100" />

                  {/* Footer Info Grid */}
                  <div className="grid md:grid-cols-2 gap-8 text-sm">
                    {/* Address */}
                    <div>
                      <p className="font-bold text-stone-900 mb-2 flex items-center gap-2">
                        <MapPin size={16} className="text-orange-600"/> Delivery Address
                      </p>
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-stone-600 leading-relaxed text-xs">
                         <p className="font-bold text-stone-800 mb-1">{order.address_snapshot.recipient_name}</p>
                         <p>{order.address_snapshot.house_no}, {order.address_snapshot.street_address}</p>
                         <p>{order.address_snapshot.city}, {order.address_snapshot.state} - {order.address_snapshot.pincode}</p>
                         <p className="mt-1 text-stone-400">Phone: {order.address_snapshot.recipient_phone}</p>
                      </div>
                    </div>

                    {/* Payment Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-stone-600">
                        <span>Subtotal</span>
                        <span>{fmt(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Delivery</span>
                        <span>{fmt(order.delivery_fee)}</span>
                      </div>

                      {/* Coupon / Discount */}
                      {(order.coupon_code || order.discount_amount > 0) && (
                        <div className="flex justify-between text-green-700 font-medium bg-green-50 px-2 py-1 rounded text-xs">
                           <span className="flex items-center gap-1">
                             <Tag size={12} /> 
                             {order.coupon_code ? `Coupon (${order.coupon_code})` : "Discount"}
                           </span>
                           <span>-{fmt(order.discount_amount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-bold text-stone-900 pt-3 border-t border-dashed border-stone-200 mt-2 text-base">
                        <span>Total Paid</span>
                        <span>{fmt(order.grand_total)}</span>
                      </div>
                      <div className="text-right text-xs text-stone-400 pt-1">
                        Paid via {order.payment_method}
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