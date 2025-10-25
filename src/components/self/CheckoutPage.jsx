import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthProvider"; // Adjust path if needed
import { apiFetch } from "../../Context/apiFetch"; // Adjust path if needed
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"; //
import { Textarea } from "@/components/ui/textarea"; //
import { Button } from "@/components/ui/button"; //
import { Label } from "@/components/ui/label"; //
import { AlertCircle, Loader2 } from "lucide-react"; // Icons for feedback

export default function CheckoutPage() {
  const { accessToken, user, loading: authLoading } = useAuth(); // Get user and loading state
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load cart from localStorage on component mount
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(storedCart);
    const calculatedTotal = storedCart.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    setTotal(calculatedTotal);
  }, []);

  const handlePlaceOrder = async (e) => {
    e.preventDefault(); // Prevent default form submission if wrapped in a form
    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    if (!accessToken) {
        setError("You must be logged in to place an order.");
        // Optional: Trigger login modal or redirect
        return;
    }
    if (cart.length === 0) {
        setError("Your cart is empty.");
        return;
    }

    setLoading(true);
    setError("");

    try {
      // apiFetch will automatically add the Authorization header
      const orderData = await apiFetch("http://localhost:3000/api/orders", { // Make sure this URL is correct (no proxy)
        method: "POST",
        // No need to set Content-Type or Authorization here if apiFetch handles it
        body: JSON.stringify({ products: cart, total, address }),
      });

      console.log("Order placed successfully:", orderData);
      localStorage.removeItem("cart"); // Clear cart on success
      navigate("/thankyou"); // Redirect to thank you page

    } catch (err) {
      console.error("Order placement failed:", err);
      setError(err.message || "Failed to place order. Please try again.");
      // Handle specific errors like "Session expired" if needed
      if (err.message === "Session expired" || err.message === "Session refresh failed") {
         // apiFetch might handle redirect, or you can do it here
         // navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle initial auth loading state
  if (authLoading) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
             <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
             <p className="ml-2 text-zinc-600">Loading checkout...</p>
        </div>
    );
  }

  // Redirect if not logged in after auth check
  if (!user) {
    // You could also show a message prompting login instead of redirecting immediately
    return <Navigate to="/login" state={{ from: '/checkout' }} replace />;
  }

  // Redirect or show message if cart is empty after loading it
  if (!authLoading && cart.length === 0) {
     return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-700">Your Cart is Empty</h2>
            <p className="text-zinc-500 mb-6">Add some delicious items to your cart before checking out.</p>
            <Button onClick={() => navigate('/shop')} className="bg-pink-600 hover:bg-pink-700 text-white">
                Go to Shop
            </Button>
        </div>
     );
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 py-20 px-4">
      <Card className="w-full max-w-2xl shadow-xl border-pink-200"> {/* */}
        <CardHeader> {/* */}
          <CardTitle className="text-2xl text-center text-pink-700">Checkout 🛒</CardTitle> {/* */}
        </CardHeader>
        <CardContent className="space-y-6"> {/* */}
          {/* Cart Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-zinc-800 border-b pb-2">Order Summary</h3>
            {cart.length > 0 ? (
              <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 text-sm text-zinc-700">
                {cart.map((item) => (
                  <li key={item.id} className="flex justify-between items-center">
                    <span>
                      {item.name} <span className="text-xs text-zinc-500">x {item.quantity}</span>
                    </span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-sm">Cart is loading or empty.</p>
            )}
            <p className="mt-4 pt-3 border-t text-right font-bold text-lg text-pink-600">
              Total: ₹{total}
            </p>
          </div>

          {/* Delivery Address Form */}
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-lg font-semibold mb-2 text-zinc-800">Delivery Address</Label> {/* */}
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border-zinc-300 p-2 rounded-md min-h-[100px] focus:border-pink-500 focus:ring-pink-500" //
                placeholder="Enter your full delivery address, including landmarks if possible."
                required
                disabled={loading}
              />
            </div>

            {/* Payment Info - Currently Cash on Delivery */}
            <div className="text-sm text-zinc-600 bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <p><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
                <p className="mt-1">Please keep the exact amount ready.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-md">
                 <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0"/>
                 <span>{error}</span>
              </div>
            )}

             {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white text-lg py-3 rounded-md transition-colors duration-200 disabled:opacity-50" //
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Placing Order...
                </>
              ) : (
                "Place Order (COD)"
              )}
            </Button>
          </form>

        </CardContent>
        {/* <CardFooter> Optional: Add extra info or links </CardFooter> */}
      </Card>
    </div>
  );
}