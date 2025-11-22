
import React, { useState } from "react";
import { useCart } from "../Context/CartContext";
import { useAuth } from "../Context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function Checkout() {
  const { items, grandTotal, discountTotal, subtotal, couponCode, loading: cartLoading } = useCart();
  const { user, API_URL } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });

  // Calculate total items for payload
  const orderProducts = items.map((item) => ({
    productId: item.product_id,
    variantId: item.product_variant_id || null,
    name: item.product_name || "Product", // Fallback if name isn't directly on item
    quantity: item.quantity,
    price: item.line_total, // Assuming line_total is the price for this line
  }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    setLoading(true);
    const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zip}. Phone: ${formData.phone}`;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          products: orderProducts,
          total: grandTotal,
          address: fullAddress,
          // Optional: Pass coupon info if your backend order table supports it
          couponCode: couponCode || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to place order");
      }

      toast.success("Order placed successfully! 🎉");
      // Redirect to a success page or orders history
      navigate("/orders"); 
      // Ideally, you should also refresh/clear the cart context here if the backend doesn't auto-clear it on the next fetch.
      window.location.reload(); // Simple way to refresh cart state if context doesn't have a clear function exposed
    } catch (err) {
      console.error("Checkout Error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">Your cart is empty</h2>
        <p className="text-stone-500 mb-6">Add some delicious treats before checking out.</p>
        <button 
          onClick={() => navigate("/shop")}
          className="px-6 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-orange-700 transition"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8 text-center">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* LEFT: Shipping Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs">1</span>
              Shipping Details
            </h2>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase">Full Name</label>
                  <input
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase">Email</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase">Phone Number</label>
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase">Address</label>
                <textarea
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                  placeholder="Street, Apartment, Landmark..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase">City</label>
                  <input
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase">State</label>
                  <input
                    required
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase">ZIP Code</label>
                  <input
                    required
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-stone-100 sticky top-24">
            <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-white text-xs">2</span>
              Order Summary
            </h2>

            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-stone-800">
                      <span className="text-orange-600 font-bold mr-2">{item.quantity}x</span>
                      {/* You might need to look up product name if not in item directly */}
                      {item.product_name || "Product Item"} 
                    </div>
                    {item.variant_label && <span className="text-xs bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">{item.variant_label}</span>}
                  </div>
                  <div className="font-mono text-stone-600">₹{item.line_total}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {couponCode && `(${couponCode})`}</span>
                  <span>-₹{discountTotal}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-stone-900 pt-2 border-t border-dashed border-stone-200 mt-2">
                <span>Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" /> Processing...
                  </>
                ) : (
                  <>
                    Confirm Order <CheckCircle className="h-5 w-5" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-stone-400 mt-3">
                Secure Checkout · Cash on Delivery
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}