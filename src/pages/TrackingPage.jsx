import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
// FIX 1: Added Loader2 to imports
import { Search, Package, Truck, CheckCircle, Clock, MapPin, AlertCircle, ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import { useAuth } from "../Context/AuthProvider";
import { apiFetch } from "../Context/apiFetch";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const STEPS = [
  { status: "pending", label: "Order Placed", icon: Clock },
  { status: "processing", label: "Baking", icon: Package },
  { status: "shipped", label: "Out for Delivery", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle },
];

export default function TrackingPage() {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [orderId, setOrderId] = useState(deliveryId || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [activeOrders, setActiveOrders] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (deliveryId) {
      fetchOrder(deliveryId);
    } else if (user) {
      fetchActiveOrders();
    }
  }, [deliveryId, user]);

  const fetchActiveOrders = async () => {
    setLoadingList(true);
    try {
        // FIX 2: Changed URL from /api/orders/user to /api/orders
        // (Based on your routes/orderRoutes.js file)
        const data = await apiFetch(`${API_BASE}/api/orders`);
        
        if (Array.isArray(data)) {
            const filtered = data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
            setActiveOrders(filtered);
        }
    } catch (error) {
        console.error("Failed to load active orders", error);
    } finally {
        setLoadingList(false);
    }
  };

  const fetchOrder = async (id) => {
    if (!id) return;
    setLoading(true);
    setOrder(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/tracking/${id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Order not found");
      
      setOrder(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderId.trim()) {
      navigate(`/track/${orderId}`);
    }
  };

  const getCurrentStepIndex = (status) => {
    if (status === "cancelled") return -1;
    const idx = STEPS.findIndex((s) => s.status === status);
    return idx === -1 ? 0 : idx;
  };

  const currentStepIndex = order ? getCurrentStepIndex(order.status) : 0;
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-serif font-bold text-stone-900">Track Your Order</h1>
          <p className="text-stone-500">Enter your Order ID to see live updates.</p>
          
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto mt-6">
            <Input 
              placeholder="e.g. 7f5cfca7..." 
              value={orderId} 
              onChange={(e) => setOrderId(e.target.value)}
              className="bg-white"
            />
            <Button type="submit" disabled={loading} className="bg-stone-900 text-white hover:bg-orange-700">
              {loading ? "Searching..." : "Track"}
            </Button>
          </form>
        </div>

        {!order && !loading && user && (
            <div className="max-w-lg mx-auto mt-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-stone-800 text-lg">Your Active Orders</h3>
                    <Link to="/orders" className="text-xs text-orange-600 hover:underline">View All History</Link>
                </div>
                
                {loadingList ? (
                    <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-300"/></div>
                ) : activeOrders.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl border border-dashed border-stone-300 text-center text-stone-500 text-sm">
                        No active orders found.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeOrders.map(active => (
                            <Link to={`/track/${active.id}`} key={active.id} className="block">
                                <div className="bg-white p-4 rounded-xl border border-stone-200 hover:border-orange-300 hover:shadow-md transition-all flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600`}>
                                            <Truck size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-stone-800 text-sm">Order #{active.id.slice(0,8)}</div>
                                            <div className="text-xs text-stone-500 capitalize">{active.status.replace('_',' ')} • ₹{Math.round(active.grand_total)}</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-stone-300 group-hover:text-orange-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        )}

        {order && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <Card className="border-none shadow-lg overflow-hidden">
              <div className={`h-2 w-full ${isCancelled ? 'bg-red-500' : 'bg-green-500'}`} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Order #{order.id.slice(0, 8)}</CardTitle>
                    <p className="text-sm text-stone-500 mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {isCancelled ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold uppercase">
                      Cancelled
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold uppercase">
                      {order.status}
                    </span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {!isCancelled && (
                  <div className="relative flex justify-between items-center mt-8 mb-8 px-2">
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-stone-200 -z-10 rounded-full" />
                    <div 
                      className="absolute left-0 top-1/2 h-1 bg-green-500 -z-10 rounded-full transition-all duration-700" 
                      style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isActive = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;

                      return (
                        <div key={step.status} className="flex flex-col items-center gap-2">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 
                              ${isActive ? "bg-green-500 border-green-500 text-white" : "bg-white border-stone-300 text-stone-300"}
                              ${isCurrent ? "ring-4 ring-green-100 scale-110" : ""}
                            `}
                          >
                            <Icon size={18} />
                          </div>
                          <span className={`text-xs font-bold ${isActive ? "text-stone-800" : "text-stone-400"}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isCancelled && (
                   <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-center text-red-800 flex flex-col items-center gap-2 my-4">
                      <AlertCircle size={24} />
                      <p>This order has been cancelled. Please contact support for assistance.</p>
                   </div>
                )}

                <div className="grid md:grid-cols-2 gap-6 mt-6 p-4 bg-stone-50 rounded-xl border border-stone-100">
                  <div>
                    <h4 className="text-sm font-bold text-stone-400 uppercase mb-2 flex items-center gap-2">
                      <MapPin size={14} /> Delivery Address
                    </h4>
                    <div className="text-sm text-stone-700 leading-relaxed">
                      <p className="font-bold">{order.address_snapshot?.recipient_name}</p>
                      <p>{order.address_snapshot?.house_no}, {order.address_snapshot?.street_address}</p>
                      <p>{order.address_snapshot?.city} - {order.address_snapshot?.pincode}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-400 uppercase mb-2 flex items-center gap-2">
                      <Package size={14} /> Order Summary
                    </h4>
                    <ul className="space-y-1">
                      {order.order_items?.map((item, i) => (
                        <li key={i} className="flex justify-between text-sm text-stone-600">
                          <span>{item.quantity}x {item.product_name} ({item.variant_label || item.unit})</span>
                        </li>
                      ))}
                    </ul>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-stone-900">
                      <span>Total</span>
                      <span>₹{Math.round(order.grand_total)}</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            <div className="text-center">
               <p className="text-stone-500 text-sm">Need help? <a href="/#contact" className="text-orange-600 hover:underline font-bold">Contact Support</a></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}