import React, { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] md:w-[80%] backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-pink-500">🍰</span>
          <h1 className="text-xl md:text-2xl font-semibold text-white tracking-wide">
            Alka Bakery
          </h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8 text-white/90">
          {["Home", "Menu", "Gallery", "About", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="hover:text-pink-400 transition-colors duration-300"
            >
              {item}
            </a>
          ))}
          <button className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-md transition-all">
            Order Now
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden flex flex-col items-center space-y-4 py-4 bg-white/10 backdrop-blur-md border-t border-white/20 rounded-b-2xl">
          {["Home", "Menu", "Gallery", "About", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setOpen(false)}
              className="text-white/90 hover:text-pink-400 transition-colors"
            >
              {item}
            </a>
          ))}
          <button className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-md transition-all">
            Order Now
          </button>
        </div>
      )}
    </nav>
  );
}
