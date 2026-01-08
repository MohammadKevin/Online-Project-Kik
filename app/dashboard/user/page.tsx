"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { API_URL } from "@/lib/api";
import {
  Search,
  ShoppingCart,
  Trash2,
  X,
  Plus,
  Minus,
  Filter,
  ChevronDown,
} from "lucide-react";

/* =========================
   TYPES
========================= */
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  images?: string[];
  stock: number;
  category?: string;
  createdAt?: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stock?: number;
}

/* =========================
   DEBOUNCE HELPER
========================= */
function debounce<T extends (...args: any[]) => void>(fn: T, ms = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* =========================
   PAGE
========================= */
export default function UserDashboard() {
  const router = useRouter();

  const [username, setUsername] = useState("Pengguna");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [qImmediate, setQImmediate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [sortBy, setSortBy] = useState<
    "recommended" | "price_asc" | "price_desc" | "newest"
  >("recommended");

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [qtySelected, setQtySelected] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* =========================
     AUTH CHECK
  ========================= */
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return router.push("/login");

    try {
      const user = JSON.parse(raw);
      if (user.role !== "customer") return router.push("/login");
      setUsername(user.username || "Pengguna");
    } catch {
      router.push("/login");
    }
  }, [router]);

  /* =========================
     FETCH PRODUCTS
  ========================= */
  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error("Fetch error");
        const data = await res.json();

        if (!mounted) return;

        const normalized: Product[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: Number(p.price ?? 0),
          image:
            (p.images && p.images[0]) ||
            p.image ||
            "/placeholder-product.png",
          images: p.images || (p.image ? [p.image] : []),
          stock: Number(p.stock ?? 0),
          category: p.category || "Umum",
          createdAt: p.createdAt,
        }));

        setProducts(normalized);

        const cats = Array.from(
          new Set(normalized.map((p) => p.category || "Umum"))
        );
        setCategories(cats);
      } catch (err) {
        console.error("Gagal fetch produk:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     CART STORAGE
  ========================= */
  useEffect(() => {
    const raw = localStorage.getItem("cart");
    if (!raw) return;
    try {
      const arr = JSON.parse(raw) as CartItem[];
      setCart(arr);
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  /* =========================
     SEARCH DEBOUNCE
  ========================= */
  useEffect(() => {
    const fn = debounce((q: string) => setQuery(q), 300);
    fn(qImmediate);
  }, [qImmediate]);

  /* =========================
     FILTERED LIST
  ========================= */
  const filtered = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "newest")
      list.sort(
        (a, b) =>
          new Date(b.createdAt || Date.now()).getTime() -
          new Date(a.createdAt || Date.now()).getTime()
      );

    return list;
  }, [products, query, selectedCategory, sortBy]);

  /* =========================
     CART HELPERS
  ========================= */
  const addToCart = (p: Product, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === p.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity = Math.min(
          updated[idx].quantity + qty,
          p.stock
        );
        return updated;
      }
      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          price: p.price,
          quantity: Math.min(qty, p.stock),
          image: p.image,
          stock: p.stock,
        },
      ];
    });

    setToast(`${p.name} ditambahkan ke keranjang`);
    setTimeout(() => setToast(null), 1500);
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: number, quantity: number) =>
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  );

  /* =========================
     RENDER
  ========================= */
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl font-extrabold">
          Halo, <span className="text-sky-700">{username}</span> 👋
        </h1>
      </div>

      <section className="max-w-7xl mx-auto px-4 pb-24">
        {loading ? (
          <p className="text-center text-slate-500">Memuat produk...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-500">
            Produk tidak ditemukan.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border p-4 shadow-sm"
              >
                <img
                  src={`${API_URL}${p.image?.startsWith("/") ? "" : "/"}${p.image}`}
                  className="h-40 w-full object-contain mb-3"
                />
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {p.description}
                </p>
                <div className="mt-2 font-bold text-sky-700">
                  Rp {p.price.toLocaleString()}
                </div>
                <button
                  onClick={() => addToCart(p)}
                  disabled={p.stock === 0}
                  className="mt-3 w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-lg"
                >
                  Tambah
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full">
          {toast}
        </div>
      )}
    </main>
  );
}