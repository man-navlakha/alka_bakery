import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";

const categories = [
  "Featured Items",
  "Combos @15% OFF",
  "Diwali Specials",
  "Gifting",
  "Cakes",
  "Pastries",
  "Brownies",
  "Cookies & Crackers",
  "Beverages",
  "Collectibles",
];

const products = [
  {
    id: 1,
    name: "Eggless Fresh Cream Pineapple Cake [500g]",
    price: 675,
    tag: "Bestseller",
    image:
      "https://images.unsplash.com/photo-1606312619344-df6e2b6b37f3?w=500&q=80",
    category: "Cakes",
  },
  {
    id: 2,
    name: "Eggless Dutch Truffle Cake [500g]",
    price: 650,
    tag: "Bestseller",
    image:
      "https://images.unsplash.com/photo-1606756790138-57dca26d6d4e?w=500&q=80",
    category: "Cakes",
  },
  {
    id: 3,
    name: "Eggless Choco Chip Brownie [1 Piece]",
    price: 115,
    tag: "Bestseller",
    image:
      "https://images.unsplash.com/photo-1590080875831-e624fc4e2434?w=500&q=80",
    category: "Brownies",
  },
  {
    id: 4,
    name: "Choice of Eggless Brownie + Beverage",
    price: 239,
    tag: "Combo",
    image:
      "https://images.unsplash.com/photo-1617196037302-0ecfc9d584da?w=500&q=80",
    category: "Combos @15% OFF",
  },
];

export default function AlkaBakeryShop() {
  const [selectedCategory, setSelectedCategory] = useState("Featured Items");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
        </div>
        <ScrollArea className="flex-1">
          <ul className="space-y-1 p-3">
            {categories.map((cat) => (
              <li key={cat}>
                <Button
                  variant={selectedCategory === cat ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </aside>

      {/* CENTER PRODUCT SECTION */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-pink-700">Alka Bakery 🍰</h1>
          <Input
            placeholder="Search menu..."
            className="max-w-sm bg-white shadow-sm"
          />
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            {selectedCategory || "Best Sellers"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-md transition"
                  onClick={() => setSelectedProduct(item)}
                >
                  <CardHeader className="p-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="rounded-lg h-36 w-full object-cover"
                    />
                  </CardHeader>
                  <CardContent className="p-3">
                    <CardTitle className="text-sm font-medium mb-1">
                      {item.name}
                    </CardTitle>
                    <p className="text-pink-600 font-semibold">
                      ₹{item.price}
                    </p>
                    <Button className="w-full mt-2">ADD +</Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-500">No products available</p>
            )}
          </div>
        </section>
      </main>

      {/* RIGHT SIDEBAR - PRODUCT DETAILS */}
      <aside className="hidden lg:block w-80 bg-white border-l">
        {selectedProduct ? (
          <div className="p-4">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="rounded-xl w-full h-48 object-cover"
            />
            <h3 className="mt-4 text-lg font-semibold">
              {selectedProduct.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="gold" />
              ))}
            </div>
            <p className="mt-2 text-pink-700 font-bold">
              ₹{selectedProduct.price}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Category: {selectedProduct.category}
            </p>
            <Button className="w-full mt-4">Add to Cart</Button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a product to view details
          </div>
        )}
      </aside>
    </div>
  );
}
