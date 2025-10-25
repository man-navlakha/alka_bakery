import React, { useEffect, useState } from "react";
import { apiFetch } from "../Context/apiFetch";

export default function Shop() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    apiFetch("http://localhost:3000/api/products")
      .then(setProducts)
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map(p => (
        <div key={p.id} className="border p-4 rounded shadow hover:shadow-lg">
          <img src={p.image} alt={p.name} className="w-full h-48 object-cover rounded mb-2" />
          <h3 className="font-semibold">{p.name}</h3>
          <p className="text-pink-600 font-bold">₹{p.price}</p>
          <p className="text-gray-600 text-sm">{p.description}</p>
        </div>
      ))}
    </div>
  );
}
