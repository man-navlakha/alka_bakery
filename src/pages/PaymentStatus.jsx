import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../Context/apiFetch";
import { useCart } from "../Context/CartContext"; // To reload cart
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { reloadCart } = useCart();
  
  const [status, setStatus] = useState("verifying"); // verifying | success | failed


  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 3;

    const verifyPayment = async () => {
      const transactionId = searchParams.get("txnId");
      const addressId = searchParams.get("addrId");

      if (!transactionId || !addressId) {
        setStatus("failed");
        return;
      }

      try {
        const res = await apiFetch(`${API_BASE}/api/payment/phonepe/validate`, {
          method: "POST",
          body: JSON.stringify({ transactionId, addressId }),
        });

        if (res.success) {
          setStatus("success");
          await reloadCart();
          setTimeout(() => navigate("/orders"), 3000);
        } 
        // Handle Pending State
        else if (res.status === "PENDING" && attempts < maxAttempts) {
            attempts++;
            console.log(`Payment Pending... Retrying (${attempts}/${maxAttempts})`);
            setTimeout(verifyPayment, 2000); // Retry after 2 seconds
        }
        else {
          setStatus("failed");
        }
      } catch (error) {
        console.error("Verification Error", error);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-100 max-w-md w-full text-center">
        
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
            <h2 className="text-xl font-bold text-stone-800">Verifying Payment</h2>
            <p className="text-stone-500">Please wait while we confirm with the bank...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
            <p className="text-stone-500">Your order has been placed successfully.</p>
            <Button onClick={() => navigate("/orders")} className="mt-4 w-full">View Orders</Button>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-700">Payment Failed</h2>
            <p className="text-stone-500">Something went wrong. Your money is safe.</p>
            <Button onClick={() => navigate("/checkout")} variant="outline" className="mt-4 w-full">Try Again</Button>
          </div>
        )}

      </div>
    </div>
  );
}