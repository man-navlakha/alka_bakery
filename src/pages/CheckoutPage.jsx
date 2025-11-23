// src/pages/CheckoutPage.jsx
import React, { useEffect, useState } from "react";
import { useCart } from "../Context/CartContext";
import { apiFetch } from "../Context/apiFetch";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, ShoppingBag, Wallet, CheckCircle, AlertCircle, Loader2, ChevronRight, Tag } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function CheckoutPage() {
  const { items, giftItems, subtotal, discountTotal, grandTotal, reloadCart, couponCode } = useCart();
  const navigate = useNavigate();
  
  const [addresses, setAddresses] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const DELIVERY_FEE = 50;
  const FINAL_PAYABLE = grandTotal + DELIVERY_FEE;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [addrData, prodData] = await Promise.all([
          apiFetch(`${API_BASE}/api/addresses`),
          fetch(`${API_BASE}/api/products`).then(r => r.json())
        ]);
        setAddresses(addrData || []);
        setProducts(prodData || []);
        const def = addrData?.find(a => a.is_default);
        if (def) setSelectedAddressId(def.id);
        else if (addrData?.length > 0) setSelectedAddressId(addrData[0].id);
      } catch (e) {
        console.error("Checkout load error", e);
        toast.error("Failed to load details");
      } finally {
        setLoadingAddr(false);
      }
    };
    loadData();
  }, []);

  const getItemDetails = (cartItem) => {
    const product = products.find(p => p.id === cartItem.product_id);
    let image = null;
    if (product) {
        if (product.product_images?.length > 0) image = product.product_images[0].url;
        else if (product.images?.length > 0) image = typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url;
        else if (product.image) image = product.image;
    }
    let label = "Standard";
    if (cartItem.unit === 'gm') label = `${cartItem.grams}g`;
    else if (cartItem.unit === 'variant') label = cartItem.variant_label;

    return {
        name: product?.name || "Item",
        category: product?.category || "Bakery",
        image: image || "https://placehold.co/100x100?text=Pastry",
        label
    };
  };

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }
    setPlacingOrder(true);
    try {
      await apiFetch(`${API_BASE}/api/orders`, {
        method: "POST",
        body: JSON.stringify({ addressId: selectedAddressId, paymentMethod: "COD" })
      });
      toast.success("Order placed successfully! 🎉");
      await reloadCart(); 
      navigate("/orders"); 
    } catch (error) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  }

  const fmt = (n) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;

  if (items.length === 0 && giftItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-500">
        <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mb-4"><ShoppingBag size={24} /></div>
        <p className="text-lg font-medium mb-4">Your cart is empty</p>
        <Link to="/shop"><Button>Back to Menu</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Checkout</h1>
        
        <div className="grid md:grid-cols-[1fr_380px] gap-8">
          {/* LEFT: Details */}
          <div className="space-y-6">
            {/* Address Selection */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-700"><MapPin size={20} /></div>
                  <h2 className="text-lg font-bold text-stone-800">Delivery Address</h2>
                </div>
                <Link to="/addresses"><Button variant="ghost" size="sm" className="text-orange-700 hover:bg-orange-50">+ Add New</Button></Link>
              </div>
              {loadingAddr ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-stone-300" /></div>
              ) : addresses.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50 text-center">
                  <p className="text-stone-500 text-sm mb-3">No address saved</p>
                  <Link to="/addresses"><Button variant="outline" size="sm">Add Address</Button></Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {addresses.map(addr => (
                    <div 
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${selectedAddressId === addr.id ? "border-orange-500 bg-orange-50/30" : "border-stone-100 hover:border-orange-200 bg-white"}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">{addr.type}</span>
                        {selectedAddressId === addr.id && <CheckCircle size={18} className="text-orange-600" fill="currentColor" color="white" />}
                      </div>
                      <div className="font-bold text-stone-800 text-sm mb-1">{addr.recipient_name}</div>
                      <div className="text-xs text-stone-500 leading-relaxed">{addr.house_no}, {addr.street_address}, {addr.city}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-full text-blue-700"><ShoppingBag size={20} /></div>
                <h2 className="text-lg font-bold text-stone-800">Order Items</h2>
              </div>
              <div className="space-y-6">
                {items.map((item) => {
                  const details = getItemDetails(item);
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden border border-stone-100 shrink-0"><img src={details.image} alt="" className="w-full h-full object-cover" /></div>
                      <div className="flex-1 min-w-0 flex justify-between items-start">
                        <div><h4 className="font-bold text-stone-800 text-sm">{details.name}</h4><p className="text-xs text-stone-500">{details.label} • Qty: {item.quantity}</p></div>
                        <p className="font-bold text-stone-900 text-sm">{fmt(item.line_total)}</p>
                      </div>
                    </div>
                  );
                })}
                {giftItems.map((item) => {
                  const details = getItemDetails(item);
                  return (
                    <div key={item.id} className="flex gap-4 bg-orange-50 p-3 rounded-xl border border-orange-100">
                      <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex items-center justify-center"><span className="text-lg">🎁</span></div>
                      <div className="flex-1 flex justify-between items-center">
                        <div><h4 className="font-bold text-orange-900 text-sm">{details.name}</h4><p className="text-[10px] text-orange-700">Free Gift</p></div>
                        <span className="text-xs font-bold text-green-600">FREE</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 sticky top-24">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Wallet size={20} /> Payment Summary</h2>
              <div className="space-y-3 text-sm text-stone-600">
                <div className="flex justify-between"><span>Item Total</span><span>{fmt(subtotal)}</span></div>
                
                {/* Coupon Display */}
                {couponCode && (
                  <div className="flex justify-between text-green-700 bg-green-50 px-2 py-1 rounded">
                    <span className="flex items-center gap-1"><Tag size={12}/> Coupon ({couponCode})</span>
                    <span>-{fmt(discountTotal)}</span>
                  </div>
                )}
                {!couponCode && discountTotal > 0 && (
                   <div className="flex justify-between text-green-700"><span>Discount</span><span>-{fmt(discountTotal)}</span></div>
                )}

                <div className="flex justify-between"><span>Delivery Fee</span><span>{fmt(DELIVERY_FEE)}</span></div>
                <Separator className="my-3" />
                <div className="flex justify-between items-center text-stone-900 pt-1">
                  <span className="font-bold text-base">To Pay</span>
                  <span className="font-bold text-2xl font-serif">{fmt(FINAL_PAYABLE)}</span>
                </div>
              </div>

              <Button onClick={handlePlaceOrder} disabled={placingOrder || !selectedAddressId} className="w-full mt-6 bg-stone-900 hover:bg-orange-600 text-white h-14 text-lg font-bold shadow-lg rounded-xl group">
                {placingOrder ? <><Loader2 className="animate-spin mr-2" /> Processing...</> : <span className="flex items-center justify-center gap-2">Place Order <ChevronRight size={18} /></span>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}