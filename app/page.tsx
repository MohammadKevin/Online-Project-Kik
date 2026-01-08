"use client";

import React, { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import { motion } from "framer-motion";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  stock?: number;
}

const placeholderImage = "https://via.placeholder.com/400x300?text=Product";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(val);

/* =======================
   PRODUCT CARD
======================= */
const ProductCard: React.FC<{ p: Product }> = ({ p }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{
      y: -6,
      boxShadow:
        "0 12px 20px rgba(245,124,0,0.25)",
    }}
    className="bg-white border border-[#E0C97A] rounded-2xl overflow-hidden transition"
  >
    <Link href={`/product/${p.id}`} className="relative block h-48 bg-[#FFF3CD]">
      <img
        src={p.image || placeholderImage}
        alt={p.name}
        className="w-full h-full object-cover transition duration-500 hover:scale-105"
        onError={(e) => (e.currentTarget.src = placeholderImage)}
      />

      {p.stock === 0 && (
        <span className="absolute top-2 right-2 bg-[#5D4037] text-white px-3 py-1 rounded-full text-xs font-bold">
          Habis
        </span>
      )}

      {p.stock !== undefined && p.stock > 0 && p.stock < 5 && (
        <span className="absolute top-2 right-2 bg-[#D84315] text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          Stok Tipis
        </span>
      )}
    </Link>

    <div className="p-4 flex flex-col h-full">
      <Link
        href={`/product/${p.id}`}
        className="font-semibold text-[#3E2723] hover:text-[#F57C00] line-clamp-2"
      >
        {p.name}
      </Link>

      <div className="mt-2 text-lg font-extrabold text-[#F57C00]">
        {formatCurrency(p.price)}
      </div>

      <div className="mt-auto pt-4 flex gap-2 border-t border-[#E0C97A]">
        <Link
          href={`/product/${p.id}`}
          className="flex-1 bg-[#FBC02D] hover:bg-[#F9A825] text-[#3E2723] text-center py-2 rounded-lg font-bold"
        >
          Lihat
        </Link>
        <button
          className="flex-1 border border-[#FBC02D] text-[#F57C00] hover:bg-[#FFF3CD] py-2 rounded-lg font-bold"
        >
          + Keranjang
        </button>
      </div>
    </div>
  </motion.div>
);

/* =======================
   PAGE
======================= */
export default function DiscoveryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHero, setActiveHero] = useState(0);
  const heroRef = useRef<NodeJS.Timeout | null>(null);

  const heroBanners = [
    {
      title: "Keripik Pisang Paling Renyah",
      subtitle: "Rasa gurih & manis bikin nagih 🍌",
      image: "/hero1.jpg",
      cta: "/collections/promo",
    },
    {
      title: "Promo Harian Spesial",
      subtitle: "Diskon & bonus tiap hari",
      image: "/hero2.jpg",
      cta: "/collections/harian",
    },
    {
      title: "Gratis Ongkir Nasional",
      subtitle: "Belanja makin hemat",
      image: "/hero3.jpg",
      cta: "/promotions",
    },
  ];

  const categories = [
    "Semua",
    "Original",
    "Coklat",
    "Keju",
    "Balado",
    "Manis",
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error("Gagal ambil data produk");
        const data: Product[] = await res.json();
        setProducts(
          data.map((p) => ({
            ...p,
            image: p.image ? `${API_URL}${p.image}` : placeholderImage,
          }))
        );
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    heroRef.current = setInterval(
      () => setActiveHero((v) => (v + 1) % heroBanners.length),
      4500
    );
    return () => heroRef.current && clearInterval(heroRef.current);
  }, []);

  return (
    <main className="min-h-screen bg-[#FFF8E1] text-[#3E2723]">
      <Header />

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 mt-6">
        <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden shadow-2xl">
          {heroBanners.map((b, i) => (
            <motion.div
              key={i}
              animate={{ opacity: i === activeHero ? 1 : 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={b.image}
                alt={b.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#3E2723]/70 via-[#F57C00]/30 to-transparent" />

              <div className="absolute left-6 bottom-6 text-white max-w-md">
                <h2 className="text-4xl font-extrabold">{b.title}</h2>
                <p className="mt-2 opacity-90">{b.subtitle}</p>
                <Link
                  href={b.cta}
                  className="inline-block mt-4 bg-[#F57C00] hover:bg-[#EF6C00] px-6 py-3 rounded-full font-bold shadow-lg"
                >
                  Lihat Promo
                </Link>
              </div>
            </motion.div>
          ))}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {heroBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveHero(i)}
                className={`h-3 rounded-full transition-all ${
                  i === activeHero
                    ? "bg-[#FBC02D] w-6"
                    : "bg-white/60 w-3"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 mt-10">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c}
              className="bg-[#FFE082] hover:bg-[#FFD54F] border border-[#FBC02D] text-[#3E2723] px-5 py-2 rounded-full font-semibold"
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <h3 className="text-3xl font-extrabold mb-6">
          Semua Produk
        </h3>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-72 bg-white rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="mt-16 py-8 bg-[#FFF3CD] text-center text-sm text-[#5D4037]">
        © {new Date().getFullYear()} <b>PisangRenyah</b> — Renyahnya Bikin Nagih 🍌
      </footer>
    </main>
  );
}