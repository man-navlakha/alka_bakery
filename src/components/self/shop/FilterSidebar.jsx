import React, { useState } from "react";

export default function FilterSidebar({ categories = [], onFilterChange }) {
  const [categoryId, setCategoryId] = useState(""); // State holds the ID
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [search, setSearch] = useState("");

  const apply = () => {
    const priceRange = (minPrice || maxPrice) ? [Number(minPrice || 0), Number(maxPrice || 99999)] : null;
    // Pass categoryId as 'category' to the handler
    onFilterChange({ category: categoryId, priceRange, sort, search });
  };

  const clear = () => {
    setCategoryId(""); setMinPrice(""); setMaxPrice(""); setSort(""); setSearch("");
    onFilterChange({});
  };

  return (
    <aside className="bg-white dark:bg-zinc-800 rounded-lg p-4 shadow">
      {/* ... (Search input remains the same) ... */}
      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600" />
      </div>


      {/* Updated Category Select */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Category</h4>
        <select
          className="w-full p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
          value={categoryId} // Bind to categoryId state
          onChange={(e) => setCategoryId(e.target.value)} // Update categoryId state
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}> {/* Use cat.id as value */}
              {cat.name} {/* Display cat.name */}
            </option>
          ))}
        </select>
      </div>

      {/* ... (Price and Sort remain the same) ... */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Price (₹)</h4>
        <div className="flex gap-2">
          <input type="number" className="w-1/2 p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <input type="number" className="w-1/2 p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Sort By</h4>
        <select className="w-full p-2 border rounded dark:bg-zinc-700 dark:border-zinc-600" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Default</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="new">Newest Arrivals</option>
        </select>
      </div>


      {/* ... (Apply/Clear buttons remain the same) ... */}
      <div className="flex gap-2 mt-6">
        <button onClick={apply} className="flex-1 bg-pink-600 text-white px-3 py-2 rounded hover:bg-pink-700 transition">Apply Filters</button>
        <button onClick={clear} className="flex-1 border rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 transition">Clear All</button>
      </div>
    </aside>
  );
}
