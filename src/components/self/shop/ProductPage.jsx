import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../../Context/apiFetch";
import { Button } from "@/components/ui/button";
import Navbar from "../Navbar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
// import { useCart } from "../../../Context/CartContext"; // Import useCart
import { Input } from "@/components/ui/input"; // Import Input

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart: addToCartContext } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1); // Default, will update after fetch

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`http://localhost:3000/api/products/${id}`);
        setProduct(data);
        // Set initial quantity based on fetched product unit
        const fetchedUnitName = data?.units?.name?.toLowerCase();
        if (fetchedUnitName === 'kg') {
            setQuantity(0.5);
        } else if (fetchedUnitName === 'g') {
            setQuantity(50);
        } else {
            setQuantity(1);
        }
      } catch (err) {
          console.error("Failed to fetch product:", err);
          toast.error("Could not load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

   // Calculate unit-specific settings once product is loaded
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
    setQuantity(minQty); // Reset to minimum after adding
  };
  if (loading) return (
      <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
  );

  if (!product) return <p className="text-center py-10">Product not found.</p>;
return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-pink-50 dark:from-zinc-900 dark:to-pink-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-10 items-start">
        {/* ... (Image) ... */}
         <img src={product.image || "..."} alt={product.name} className="rounded-lg shadow-lg object-cover w-full aspect-[4/3]" />

        <div className="pt-4 md:pt-0">
          {/* ... (Category, Name, Description, Price display) ... */}
          <p className="text-sm text-pink-500 ...">{product.categories?.name || 'Uncategorized'}</p>
          <h1 className="text-3xl font-bold ...">{product.name}</h1>
          <p className="text-lg mb-4 ...">{product.description}</p>
          <p className="text-2xl font-semibold text-pink-600 mb-6">
            ₹{product.price}
            
          </p>

          {/* Updated Quantity Input and Add Button */}
          <div className="flex items-center gap-4 mb-6">
             <div className="flex items-center border rounded-md bg-white dark:bg-zinc-800">
               <Button
                 variant="ghost"
                 size="sm" // Consistent size
                 className="px-3 h-10 rounded-r-none border-r dark:border-zinc-600"
                 onClick={handleDecrement}
                 disabled={parseFloat(quantity) <= minQty}
               >
                 -
               </Button>
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
                className="w-16 h-10 text-center border-0 rounded-none focus-visible:ring-0 px-1 dark:bg-zinc-800"
                 aria-label="Quantity"
              />
               <Button
                 variant="ghost"
                 size="sm" // Consistent size
                 className="px-3 h-10 rounded-l-none border-l dark:border-zinc-600"
                 onClick={handleIncrement}
               >
                 +
               </Button>
             </div> {product.units?.name && <span className="text-sm ...">/{product.units.name}</span>}
             {/* <Button onClick={handleAddToCart} size="lg" className="bg-pink-600 hover:bg-pink-700 text-white px-8">
               Add to Cart
             </Button> */}
          </div>
        </div>
      </div>
    </div>
  );
}