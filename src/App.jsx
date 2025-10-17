import React from "react";
import Aurora from "./components/Aurora";
import Navbar from "./components/self/Navbar";
import CurvedLoop from './components/CurvedLoop';
import CircularGallery from './components/CircularGallery'

export default function App() {
  return (
    <>
      <div className="relative min-h-screen bg-black overflow-hidden">
        <Aurora />
        <Navbar />
        <section className="flex flex-col -mt-20 items-center justify-center text-center h-screen relative z-10 text-white">
          <h1 className="text-5xl md:text-6xl font-bold drop-shadow-lg">
            Freshly Baked Happiness 🍰
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-xl">
            Indulge in handcrafted cakes made with love, flavor, and art.
          </p>
          <button className="mt-6 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-lg shadow-lg transition-all">
            Explore Menu
          </button>
        </section>

        <CurvedLoop
          marqueeText="Smooth Curved Animation"
          speed={1}
          curveAmount={300}
          interactive={false}
        />
      </div>
      <div style={{ height: '600px', position: 'relative' }}>
        <CircularGallery bend={3} textColor="#ffffff" borderRadius={0.05} scrollEase={0.02} />
      </div>
    </>
  );
}
