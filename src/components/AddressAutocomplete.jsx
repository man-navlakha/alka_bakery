import { useState, useEffect, useRef } from "react";

export default function AddressAutocomplete({ onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef(null);

  // ---------- Fetch suggestions (debounced) ----------
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/map/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
      setLoading(false);
    }, 300); // debounce
  }, [query]);

  // ---------- Handle keyboard navigation ----------
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      setActiveIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      }
    }
  };

  // ---------- When user selects an address ----------
  const handleSelect = async (item) => {
    setQuery(item.label);
    setSuggestions([]);

    // Fetch place details (city, area, pincode, lat/lon etc)
    const res = await fetch(`/api/map/details/${item.id}`);
    const details = await res.json();

    // Pass selected details to parent
    onSelect({
      ...item,
      details,
    });
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(-1);
        }}
        placeholder="Enter delivery address"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && (
        <div className="absolute right-3 top-3 text-gray-400 text-sm">
          Loading…
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 bg-white shadow-lg border rounded-md mt-1 max-h-60 overflow-auto z-50">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              onClick={() => handleSelect(s)}
              className={`px-4 py-2 cursor-pointer hover:bg-blue-100 
                ${activeIndex === i ? "bg-blue-100" : ""}`}
            >
              <p className="font-medium">{s.label}</p>
              <p className="text-xs text-gray-600">{s.address}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
