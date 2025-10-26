import React from "react";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products = [], loading, onQuickView, onOpenCart }) {
  if (loading) return <div className="text-center py-20">Loading products…</div>;
  if (!products || products.length === 0) return <div className="text-center py-20">No products available.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(p => <ProductCard key={p.id} product={p} onQuickView={onQuickView} onOpenCart={onOpenCart} />)}
    </div>
  );
}
