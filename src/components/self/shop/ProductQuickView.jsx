// src/components/self/ProductQuickView.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../Context/apiFetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; // Added Button import
import { Loader2, X } from "lucide-react"; // Added Icons
// import { useCart } from "../../../Context/CartContext"; // Import useCart
import { Input } from "@/components/ui/input"; // Import Input

export default function ProductQuickView({ id, onClose, onAddToCart }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart: addToCartContext } = useCart();
  const [quantity, setQuantity] = useState(1); // Default, will update

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`http://localhost:3000/api/products/${id}`);
        if (mounted) setProduct(data);
      } catch (err) {
        console.error("Failed to load product", err);
       if (mounted) {
        setProduct(data);
        const fetchedUnitName = data?.units?.name?.toLowerCase();
        if (fetchedUnitName === 'kg') setQuantity(0.5);
        else if (fetchedUnitName === 'g') setQuantity(50);
        else setQuantity(1);
    }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, onClose]);

// Calculate unit-specific settings
  const unitName = product?.units?.name?.toLowerCase();
  const step = unitName === 'kg' ? 0.5 : unitName === 'g' ? 50 : 1;
  const minQty = unitName === 'kg' ? 0.5 : unitName === 'g' ? 50 : 1;

   const handleQuantityChange = (e) => {
     const value = e.target.value;
     if (value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
       setQuantity(value);
     }
   };

    const handleIncrement = () => {
       setQuantity(prev => {
          const current = parseFloat(prev) || 0;
          const next = current + step;
          return unitName === 'kg' ? next.toFixed(1) : next;
       });
   };

    const handleDecrement = () => {
        setQuantity(prev => {
            const current = parseFloat(prev) || 0;
            const next = Math.max(minQty, current - step);
            return unitName === 'kg' ? next.toFixed(1) : next;
        });
    };


  const handleAddToCart = () => {
    const qtyToAdd = parseFloat(quantity);
    if (!product || isNaN(qtyToAdd) || qtyToAdd < minQty) {
      toast.error(`Please enter a valid quantity (minimum ${minQty}${unitName || ''}).`);
      if(isNaN(qtyToAdd) || quantity === "") setQuantity(minQty);
      return;
    }
    addToCartContext(product, qtyToAdd);
    onAddToCart?.();
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-3xl mx-auto overflow-hidden">
        {/* Close Button */}
         <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 z-10"
            aria-label="Close quick view"
         >
           <X size={20} />
         </Button>

        {loading ? (
             <div className="flex items-center justify-center h-80 p-8 text-center">
                 <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
             </div>
        ) : !product ? (
             <div className="p-8 text-center text-red-600">Failed to load product.</div>
        ) : (
          <div className="grid md:grid-cols-2">
            <img src={product.image || 'https://via.placeholder.com/600x400?text=No+Image'} alt={product.name} className="object-cover w-full h-full max-h-[400px] md:max-h-none"/>
            <div className="p-6 flex flex-col gap-3">
               {/* Display Category */}
              <p className="text-xs text-pink-500 dark:text-pink-400 font-medium uppercase tracking-wide">{product.categories?.name || 'Uncategorized'}</p>
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <div className="text-pink-600 text-xl font-semibold">
                ₹{product.price}
                 {/* Display unit */}
              
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-4 flex-grow min-h-[60px]">{product.description}</p>

            {/* Updated Quantity Input and Add Button */}
              <div className="flex gap-2 items-center mt-auto pt-4 border-t dark:border-zinc-700">
                 <div className="flex items-center border rounded-md">
                   <Button variant="ghost" size="sm" className="px-2 h-9 rounded-r-none border-r" onClick={handleDecrement} disabled={parseFloat(quantity) <= minQty}>-</Button>
                   <Input
                       type="number"
                       value={quantity}
                       onChange={handleQuantityChange}
                        onBlur={() => { // Validate on blur
                           if (quantity === "" || parseFloat(quantity) < minQty) {
                               setQuantity(minQty);
                           } else if (unitName === 'kg') {
                               setQuantity(parseFloat(quantity).toFixed(1));
                           }
                       }}
                       min={minQty}
                       step={step}
                       className="w-12 h-9 text-center border-0 rounded-none focus-visible:ring-0 px-1"
                       aria-label="Quantity"
                   />
                   <Button variant="ghost" size="sm" className="px-2 h-9 rounded-l-none border-l" onClick={handleIncrement}>+</Button>
                 </div>   {product.units?.name && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/{product.units.name}</span>
                  )}
                {/* <Button onClick={handleAddToCart} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white">Add to cart</Button> */}
              </div>
              <Button onClick={() => { window.location.href = `/product/${product.id}`; onClose(); }} variant="outline" className="w-full mt-2">View Details</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}