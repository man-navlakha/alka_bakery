import React, { useState } from "react";
import AddProductForm from "../components/self/AddProductForm";
import ProductList from "../components/self/ProductList";
import AdminOrders from "../components/self/AdminOrders";

export default function AdminProducts() {
  const [refresh, setRefresh] = useState(false);

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* <AddProductForm onProductAdded={() => setRefresh(!refresh)} /> */}
      <ProductList key={refresh} />
      <AdminOrders />
    </div>
  );
}
