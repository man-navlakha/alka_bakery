import { Routes, Route } from "react-router-dom"; // Remove BrowserRouter from imports
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Main from "./pages/Main";
import ShopWithApi from "./pages/ShopPage";
import { CartProvider } from "./Context/CartContext";
import { CartDrawerProvider } from "./Context/CartDrawerContext";
import { PrivateRoute } from "./PrivateRoute";
import Navbar from "./components/self/Navbar";
import CartSidebarGlobal from "./components/cart/CartSidebarGlobal";
import AdminRoute from "./AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProductManagement from "./pages/admin/AdminProductManagement";
import ProductPage from "./components/self/shop/ProductPage";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";

import AddressPage from "./pages/AddressPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentStatus from "./pages/PaymentStatus";
import AdminOrders from "./pages/admin/AdminOrders";
// import Toaster from "react-hot-toast";

export default function App() {
  return (
    <CartProvider>
      <CartDrawerProvider>
          <Navbar />
          <Routes>

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Main />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/shop" element={
              <ShopWithApi />} />
             
<Route element={<PrivateRoute><AddressPage /></PrivateRoute>} path="/addresses" />

<Route 
              path="/checkout" 
              element={
                <PrivateRoute>
                  <CheckoutPage />
                </PrivateRoute>
              } 
            />

            <Route 
  path="/orders" 
  element={
    <PrivateRoute>
      <OrdersPage />
    </PrivateRoute>
  } 
/>

<Route 
  path="/payment/status" 
  element={
    <PrivateRoute>
      <PaymentStatus />
    </PrivateRoute>
  } 
/>
            {/* User Routes */}
            <Route path="/profile" element={<Profile />} />

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProductManagement />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/coupon" element={<AdminCouponsPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>

          {/* Global cart drawer – always mounted */}
          <CartSidebarGlobal />
      </CartDrawerProvider>
    </CartProvider>

  );
}