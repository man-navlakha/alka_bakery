import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "../../Context/AuthProvider";


export default function AuthModal({ onAuthSuccess }) {
  const [open, setOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login: contextLogin } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLogin) {
        const result = await contextLogin(form.email, form.password);
        if (result.success) {
            onAuthSuccess?.(result.user); // Pass user data if needed
            setOpen(false);
        } else {
            setError(result.message);
        }
        setLoading(false);
    } else {
        // Registration logic remains similar, but ensure it doesn't try
        // to store the refresh token received in the response.
        try {
            const endpoint = "http://localhost:3000/api/auth/register";
            const payload = form; // Contains name, email, password
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Something went wrong");

            alert("Registration successful! Please login now.");
            setIsLogin(true); // Switch to login view
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-pink-600 hover:bg-pink-700 text-white">Login / Register</Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm rounded-2xl bg-gradient-to-br from-pink-50 to-yellow-50 shadow-lg border border-pink-200">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-pink-700">
            {isLogin ? "Welcome Back 💖" : "Create Account 🍰"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!isLogin && (
            <div>
              <Label>Name</Label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className={`w-full ${isLogin ? "bg-yellow-600 hover:bg-yellow-700" : "bg-pink-600 hover:bg-pink-700"} text-white`}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </Button>

          <p className="text-center text-sm text-gray-700">
            {isLogin ? (
              <>
                New to Alka Bakery?{" "}
                <span
                  onClick={() => setIsLogin(false)}
                  className="text-pink-600 font-medium cursor-pointer hover:underline"
                >
                  Create Account
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span
                  onClick={() => setIsLogin(true)}
                  className="text-yellow-700 font-medium cursor-pointer hover:underline"
                >
                  Login
                </span>
              </>
            )}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
