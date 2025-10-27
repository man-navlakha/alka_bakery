// src/components/self/ProductCard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
// import { useCart } from "../../../Context/CartContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProductCard({ product, onQuickView, onOpenCart }) {
  const navigate = useNavigate();
  // const { addToCart: addToCartContext } = useCart();

  // Determine unit-specific settings
  const unitName = product.units?.name?.toLowerCase();
  let initialQuantity, step, minQty;

  if (unitName === 'kg') {
    initialQuantity = 0.5;
    step = 0.5;
    minQty = 0.5;
  } else if (unitName === 'gm') {
    initialQuantity = 50;
    step = 50;
    minQty = 50;
  } else { // pcs or other default
    initialQuantity = 1;
    step = 1;
    minQty = 1;
  }

  const [quantity, setQuantity] = useState(initialQuantity); // Use unit-specific initial

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    // Allow empty input temporarily, or valid numbers
    if (value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
         setQuantity(value);
    }
  };

  const handleIncrement = () => {
      setQuantity(prev => {
          const current = parseFloat(prev) || 0;
          const next = current + step;
          // Format kg to one decimal place if needed
          return unitName === 'kg' ? next.toFixed(1) : next;
      });
  };

   const handleDecrement = () => {
       setQuantity(prev => {
          const current = parseFloat(prev) || 0;
          const next = Math.max(minQty, current - step);
          // Format kg to one decimal place if needed
           return unitName === 'kg' ? next.toFixed(1) : next;
       });
   };

  const handleAddToCart = () => {
    const qtyToAdd = parseFloat(quantity); // Use parseFloat
    if (isNaN(qtyToAdd) || qtyToAdd < minQty) {
      toast.error(`Please enter a valid quantity (minimum ${minQty}${unitName || ''}).`);
      // Reset to min quantity if invalid input remains
      if(isNaN(qtyToAdd) || quantity === "") setQuantity(minQty);
      return;
    }
    addToCartContext(product, qtyToAdd);
    onOpenCart?.();
    setQuantity(initialQuantity); // Reset quantity input after adding
  };


  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col">
       {/* ... (Image Link) ... */}
        <div className="relative overflow-hidden cursor-pointer group" onClick={() => navigate(`/product/${product.id}`)}>
           <img src={product.image || "https://via.placeholder.com/400x300?text=No+Image"} alt={product.name} className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105" />
           <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
       </div>

      <div className="p-4 flex flex-col gap-2 flex-grow">
        {/* ... (Product Name, Price, Category, Description) ... */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-sm leading-snug">{product.name}</h3>
          <div className="text-pink-600 font-semibold text-sm whitespace-nowrap">
            ₹{product.price}
            
          </div>
        </div>
         <p className="text-xs text-gray-500 dark:text-gray-400">{product.categories?.name || 'Uncategorized'}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 flex-grow min-h-[30px]">{product.description}</p>

        {/* Updated Quantity Input and Add Button */}
        <div className="mt-auto flex gap-2 pt-2 items-center">
           <div className="flex items-center border rounded-md">
             <Button
               variant="ghost"
               size="sm"
               className="px-2 h-8 rounded-r-none border-r"
               onClick={handleDecrement}
               disabled={parseFloat(quantity) <= minQty} // Check against minQty
             >
               -
             </Button>
            <Input
              type="number"
              value={quantity}
              onChange={handleQuantityChange} // Use specific handler
              onBlur={() => { // Validate on blur
                  if (quantity === "" || parseFloat(quantity) < minQty) {
                      setQuantity(minQty);
                  } else if (unitName === 'kg') {
                      // Ensure kg format
                      setQuantity(parseFloat(quantity).toFixed(1));
                  }
              }}
              min={minQty}
              step={step}
              className="w-12 h-8 text-center border-0 rounded-none focus-visible:ring-0 px-1"
              aria-label="Quantity"
            />
             <Button
               variant="ghost"
               size="sm"
               className="px-2 h-8 rounded-l-none border-l"
               onClick={handleIncrement}
             >
               +
             </Button>
           </div> {product.units?.name && (
                <span className="text-xs text-gray-500 dark:text-gray-400">/{product.units.name}</span>
             )} 
          {/* <Button onClick={handleAddToCart} size="sm" className="flex-1 bg-pink-600 text-white hover:bg-pink-700">Add</Button> */}
        </div>
        <Button onClick={() => onQuickView(product.id)} size="sm" variant="outline" className="w-full mt-2">Quick View</Button>
      </div>
    </div>
  );
}