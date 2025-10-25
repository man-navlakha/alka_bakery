import React, { useState } from "react";

import { useAuth } from "../../Context/AuthProvider";
import { apiFetch } from "../../Context/apiFetch";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const { accessToken } = useAuth();
  const [address, setAddress] = useState("");
  const navigate = useNavigate();
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    try {
      await apiFetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ products: cart, total, address }),
      });
      localStorage.removeItem("cart");
      navigate("/thank-you");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>
      <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full border p-2 rounded mb-4" placeholder="Enter delivery address" />
      <p className="font-bold mb-4">Total: ₹{total}</p>
      <button onClick={handlePlaceOrder} className="bg-pink-500 text-white px-4 py-2 rounded">Place Order</button>
    </div>
  );
}
