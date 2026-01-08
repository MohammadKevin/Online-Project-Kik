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

/* ============================
   Types
   ============================ */
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

/* ============================
   Helper: debounce
   ============================ */
function debounce<T extends (...args: any[]) => void>(fn: T, ms = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ============================
   Component
   ============================ */
export default function UserDashboard() {
  const router = useRouter();

  // user
  const [username, setUsername] = useState("Pengguna");

  // data
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  // search / filter / sort
  const [query, setQuery] = useState("");
  const [qImmediate, setQImmediate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<
    "recommended" | "price_asc" | "price_desc" | "newest"
  >("recommended");

  // modal & cart
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [qtySelected, setQtySelected] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // tiny toasts
  const [toast, setToast] = useState<string | null>(null);

  /* -------------------------
     Load user (simple auth check)
     ------------------------- */
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      // not logged in => redirect to login (keep old behavior)
      router.push("/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "customer") {
        router.push("/login");
        return;
      }
      setUsername(user.username || "Pengguna");
    } catch {
      router.push("/login");
    }
  }, [router]);

  /* -------------------------
     Fetch products
     ------------------------- */
  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error("Fetch error");
        const data = await res.json();
        if (!mounted) return;

        // normalize - ensure images exists
        const normalized = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: p.price ?? 0,
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

        // derive categories
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

  /* -------------------------
     Load cart from localStorage (and keep in sync)
     ------------------------- */
  useEffect(() => {
    const raw = localStorage.getItem("cart");
    if (!raw) return;
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) setCart(arr);
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  /* -------------------------
     Computed: filtered list
     ------------------------- */
  const filtered = useMemo(() => {
    let list = [...products];

    // category
    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    // search query
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );
    }
    // sort
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

  /* -------------------------
     Debounce search input (nice UX)
     ------------------------- */
  useEffect(() => {
    const fn = debounce((q: string) => setQuery(q), 300);
    fn(qImmediate);
    // cleanup handled in debounce closure
  }, [qImmediate]);

  /* -------------------------
     Cart helpers
     ------------------------- */
  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: Math.min(
            (updated[idx].quantity || 0) + qty,
            product.stock || 9999
          ),
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: Math.min(qty, product.stock || 9999),
            image: product.image,
            stock: product.stock,
          },
        ];
      }
    });

    setToast(`${product.name} ditambahkan ke keranjang`);
    setTimeout(() => setToast(null), 1800);
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: number, quantity: number) =>
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );

  const clearCart = () => {
    setCart([]);
    setToast("Keranjang dikosongkan");
    setTimeout(() => setToast(null), 1200);
  };

  const cartTotal = cart.reduce((s, i) => s + i.quantity * i.price, 0);

  /* -------------------------
     Small UI helpers
     ------------------------- */
  const openProductModal = (p: Product) => {
    setActiveProduct(p);
    setQtySelected(1);
  };

  const closeProductModal = () => {
    setActiveProduct(null);
    setQtySelected(1);
  };

  const handleCheckout = () => {
    // In this demo we redirect to /cart page (or register)
    router.push("/cart");
  };

  /* ============================
     Render
     ============================ */
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-white text-slate-900">
      <Header />

      {/* Top area: greeting + controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Halo, <span className="text-sky-700">{username}</span> 👋
            </h1>
            <p className="mt-1 text-slate-600">
              Produk pilihan untukmu — cari, filter, dan tambahkan ke keranjang.
            </p>
          </div>

          <div className="w-full md:w-auto flex gap-3 items-center">
            <div className="relative flex items-center bg-white border border-slate-200 rounded-full px-3 py-2 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                value={qImmediate}
                onChange={(e) => setQImmediate(e.target.value)}
                placeholder="Cari produk, kategori, atau deskripsi..."
                className="ml-3 outline-none text-sm placeholder:text-slate-400 bg-transparent"
                aria-label="Cari produk"
              />
              <button
                onClick={() => {
                  setQImmediate("");
                  setQuery("");
                }}
                className="ml-3 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-white border border-slate-200 rounded-full px-3 py-2 shadow-sm flex items-center gap-2">
                <Filter size={16} />
                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(
                      (e.target.value as string) || "all"
                    )
                  }
                  className="text-sm outline-none bg-transparent"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white border border-slate-200 rounded-full px-3 py-2 shadow-sm flex items-center gap-2">
                <ChevronDown size={16} />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as any)
                  }
                  className="text-sm outline-none bg-transparent"
                >
                  <option value="recommended">Rekomendasi</option>
                  <option value="price_asc">Harga: Terendah</option>
                  <option value="price_desc">Harga: Tertinggi</option>
                  <option value="newest">Terbaru</option>
                </select>
              </div>

              {/* Cart quick button */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="relative inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-full shadow"
                aria-label="Buka keranjang"
              >
                <ShoppingCart size={16} />
                <span className="text-sm font-medium">Keranjang</span>
                <span className="ml-2 bg-white text-sky-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="sr-only">Daftar Produk</h2>

        {/* Empty state or skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
              >
                <div className="h-44 bg-slate-100 rounded-lg mb-4" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
                <div className="flex gap-2 mt-auto">
                  <div className="h-9 bg-slate-100 rounded-full flex-1" />
                  <div className="h-9 bg-slate-100 rounded-full w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-600">Produk tidak ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((p, i) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col"
              >
                <div
                  className="relative h-44 mb-3 rounded-lg overflow-hidden bg-slate-50 cursor-pointer"
                  onClick={() => openProductModal(p)}
                >
                  <img
                    src={`${API_URL}${p.image?.startsWith("/") ? "" : "/"}${p.image}`}
                    alt={p.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => (e.currentTarget.src = "/placeholder-product.png")}
                  />
                  {p.stock === 0 && (
                    <div className="absolute left-3 top-3 bg-rose-600 text-white px-2 py-1 rounded-full text-xs">
                      Habis
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">{p.name}</h3>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{p.description}</p>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sky-700 font-extrabold">Rp {p.price.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Stok: {p.stock}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => openProductModal(p)}
                      className="text-sm bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm hover:bg-slate-50"
                    >
                      Lihat
                    </button>

                    <button
                      onClick={() => addToCart(p, 1)}
                      disabled={p.stock === 0}
                      className={`text-sm px-3 py-2 rounded-lg font-semibold transition ${
                        p.stock === 0
                          ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                          : "bg-sky-600 text-white hover:bg-sky-700"
                      }`}
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* ===========================
          Product Modal (detail)
         =========================== */}
      <AnimatePresence>
        {activeProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.98, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 20 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* left: gallery */}
                <div className="md:w-1/2 p-4">
                  <div className="bg-slate-50 rounded-lg h-80 flex items-center justify-center overflow-hidden">
                    <img
                      src={`${API_URL}${activeProduct.images && activeProduct.images.length ? (activeProduct.images[0].startsWith("/") ? "" : "/") + activeProduct.images[0] : activeProduct.image}`}
                      alt={activeProduct.name}
                      className="object-contain max-h-full"
                      onError={(e) => (e.currentTarget.src = "/placeholder-product.png")}
                    />
                  </div>

                  {activeProduct.images && activeProduct.images.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {activeProduct.images.map((src, i) => (
                        <img
                          key={i}
                          src={`${API_URL}${src.startsWith("/") ? "" : "/"}${src}`}
                          className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                          alt={`img-${i}`}
                          onError={(e) => (e.currentTarget.src = "/placeholder-product.png")}
                          onClick={() =>
                            // swap main image by moving clicked to index 0 (local state for modal)
                            // simple approach: set first element to clicked (non-persistent)
                            (activeProduct.images as string[]).unshift(
                              (activeProduct.images as string[]).splice(i, 1)[0]
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* right: details */}
                <div className="md:w-1/2 p-6 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-extrabold">{activeProduct.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{activeProduct.category}</p>
                    </div>

                    <button
                      onClick={closeProductModal}
                      className="p-2 rounded-full bg-slate-100 hover:bg-slate-200"
                      aria-label="Close modal"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mt-4 text-sky-700 font-extrabold text-lg">Rp {activeProduct.price.toLocaleString()}</div>

                  <p className="mt-4 text-sm text-slate-700 whitespace-pre-line">{activeProduct.description}</p>

                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQtySelected((q) => Math.max(1, q - 1))}
                        className="px-3 py-2"
                        aria-label="Kurangi jumlah"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        value={qtySelected}
                        onChange={(e) => {
                          const v = Math.max(1, Number(e.target.value || 1));
                          setQtySelected(Math.min(v, activeProduct.stock));
                        }}
                        className="w-16 text-center outline-none"
                        type="number"
                        min={1}
                        max={activeProduct.stock}
                      />
                      <button
                        onClick={() =>
                          setQtySelected((q) =>
                            Math.min(activeProduct.stock, q + 1)
                          )
                        }
                        className="px-3 py-2"
                        aria-label="Tambah jumlah"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-sm text-slate-500">Stok: {activeProduct.stock}</div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        addToCart(activeProduct, qtySelected);
                        closeProductModal();
                      }}
                      className={`flex-1 bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700`}
                    >
                      Tambah ke Keranjang
                    </button>

                    <button
                      onClick={() => {
                        addToCart(activeProduct, qtySelected);
                        closeProductModal();
                        router.push("/cart");
                      }}
                      className="flex-1 bg-white border border-slate-200 py-3 rounded-lg font-semibold"
                    >
                      Beli Sekarang
                    </button>
                  </div>

                  <div className="mt-auto text-xs text-slate-400">
                    Harga bisa berubah sewaktu-waktu. Pastikan stok tersedia sebelum checkout.
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===========================
          Cart Drawer (slide-in)
         =========================== */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full md:w-[420px] bg-white shadow-2xl border-l overflow-y-auto"
          >
            <div className="p-4 sticky top-0 bg-white border-b z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart size={18} />
                <div>
                  <div className="font-semibold">Keranjang</div>
                  <div className="text-xs text-slate-500">{cart.reduce((s,i)=>s+i.quantity,0)} item</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={clearCart} className="text-sm text-rose-600 hover:underline flex items-center gap-2">
                  <Trash2 size={14} /> Kosongkan
                </button>
                <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-full bg-slate-100">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Keranjangmu kosong.</div>
              ) : (
                <>
                  <ul className="space-y-4">
                    {cart.map((it) => (
                      <li key={it.id} className="flex items-center gap-3">
                        <img src={`${API_URL}${it.image?.startsWith("/") ? "" : "/"}${it.image}`} alt={it.name} className="w-16 h-16 object-cover rounded-lg border" onError={(e)=> (e.currentTarget.src="/placeholder-product.png")} />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{it.name}</div>
                          <div className="text-xs text-slate-500">Rp {it.price.toLocaleString()}</div>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}
                              className="p-1 bg-slate-100 rounded"
                              aria-label="Kurangi"
                            >
                              <Minus size={12} />
                            </button>

                            <input
                              type="number"
                              value={it.quantity}
                              min={1}
                              max={it.stock ?? 9999}
                              onChange={(e) =>
                                updateQuantity(
                                  it.id,
                                  Math.min(Number(e.target.value || 1), it.stock ?? 9999)
                                )
                              }
                              className="w-14 text-center border rounded p-1 text-sm"
                            />

                            <button
                              onClick={() => updateQuantity(it.id, Math.min((it.stock ?? 9999), it.quantity + 1))}
                              className="p-1 bg-slate-100 rounded"
                              aria-label="Tambah"
                            >
                              <Plus size={12} />
                            </button>

                            <button
                              onClick={() => removeFromCart(it.id)}
                              className="ml-auto text-rose-600 text-xs"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <div>Subtotal</div>
                      <div className="font-semibold">Rp {cartTotal.toLocaleString()}</div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button onClick={handleCheckout} className="flex-1 bg-sky-600 text-white py-3 rounded-lg font-semibold">
                        Checkout Sekarang
                      </button>
                      <button onClick={()=> setDrawerOpen(false)} className="flex-1 bg-white border border-slate-200 py-3 rounded-lg">Lanjut Belanja</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ---------------------------
         Toast kecil (bottom-center)
         --------------------------- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50"
          >
            <div className="bg-slate-800 text-white px-4 py-2 rounded-full shadow">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}