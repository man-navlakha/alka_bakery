import React, { useState } from "react";

export default function FilterSidebar({ categories = [], onFilterChange }) {
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [search, setSearch] = useState("");

  const apply = () => {
    const priceRange = (minPrice || maxPrice) ? [Number(minPrice || 0), Number(maxPrice || 99999)] : null;
    onFilterChange({ category, priceRange, sort, search });
  };

  const clear = () => {
    setCategory(""); setMinPrice(""); setMaxPrice(""); setSort(""); setSearch("");
    onFilterChange({}); 
  };

  return (
    <aside className="bg-white dark:bg-zinc-800 rounded-lg p-4 shadow">
      <div className="mb-4">
        <input type="text" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search products" className="w-full p-2 border rounded"/>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Category</h4>
        <select className="w-full p-2 border rounded" value={category} onChange={(e)=>setCategory(e.target.value)}>
          <option value="">All</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Price</h4>
        <div className="flex gap-2">
          <input className="w-1/2 p-2 border rounded" placeholder="min" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} />
          <input className="w-1/2 p-2 border rounded" placeholder="max" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} />
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Sort</h4>
        <select className="w-full p-2 border rounded" value={sort} onChange={(e)=>setSort(e.target.value)}>
          <option value="">Default</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="new">Newest</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button onClick={apply} className="flex-1 bg-pink-600 text-white px-3 py-2 rounded">Apply</button>
        <button onClick={clear} className="flex-1 border rounded px-3 py-2">Clear</button>
      </div>
    </aside>
  );
}
