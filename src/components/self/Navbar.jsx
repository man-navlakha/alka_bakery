import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../Context/AuthProvider";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/20 backdrop-blur-md p-4 flex justify-between items-center z-50">
      <Link to="/" className="text-2xl font-bold text-pink-500">🍰 Alka Bakery</Link>

      <div className="hidden md:flex space-x-4 items-center">
        <Link to="/">Home</Link>
        <Link to="/shop">Shop</Link>
        <Link to="/cart">Cart</Link>
        {user?.role === "admin" && <Link to="/admin/orders">Admin</Link>}
        {user ? (
          <button onClick={logout} className="bg-pink-500 text-white px-3 py-1 rounded">Logout</button>
        ) : (
          <Link to="/login" className="bg-pink-500 text-white px-3 py-1 rounded">Login</Link>
        )}
      </div>

      <button className="md:hidden" onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
    </nav>
  );
}
