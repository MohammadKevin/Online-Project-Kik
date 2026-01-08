"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { ArrowLeft, ShoppingCart, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: number;
  name: string;
  price: number;
  category?: string;
  stock?: number;
  description?: string;
  image?: string;
  images?: string[];
  rating?: number;
  reviewsCount?: number;
}

const placeholder = "/placeholder-product.png";

/**
 * Blue Modern - Premium Product Page
 * - No Header (page full)
 * - Glass back & cart floating (top corners)
 * - Hero image card with 3D hover tilt effect (CSS + small JS)
 * - Price glossy card
 * - Rating overlay
 * - Related products horizontal carousel with arrows
 * - Add to cart -> localStorage
 * - Sticky mobile bottom actions
 */

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainIndex, setMainIndex] = useState(0);
  const [images, setImages] = useState<string[]>([placeholder]);
  const [isAdding, setIsAdding] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, scale: 1 });

  const sliderInterval = useRef<number | null>(null);
  const relatedRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/products/${params.id}`);
        if (!res.ok) throw new Error("Produk tidak ditemukan");
        const data = await res.json();

        const imgs: string[] = [];
        if (data.images && Array.isArray(data.images) && data.images.length) {
          for (const im of data.images) {
            imgs.push(`${API_URL}${im.startsWith("/") ? "" : "/"}${im}`);
          }
        } else if (data.image) {
          imgs.push(`${API_URL}${data.image.startsWith("/") ? "" : "/"}${data.image}`);
        } else {
          imgs.push(placeholder);
        }

        setProduct({
          ...data,
          images: imgs,
          rating: data.rating ?? 4.6,
          reviewsCount: data.reviewsCount ?? 0,
        });
        setImages(imgs.length ? imgs : [placeholder]);
        setMainIndex(0);
      } catch (err) {
        console.error(err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Fetch related (by category)
  useEffect(() => {
    if (!product?.category) return;
    const fetchRelated = async () => {
      try {
        const res = await fetch(`${API_URL}/products?category=${encodeURIComponent(product.category)}&limit=8`);
        if (!res.ok) return;
        const data = await res.json();
        const filtered = (data || [])
          .filter((p: Product) => p.id !== product.id)
          .slice(0, 8)
          .map((p: any) => ({
            ...p,
            images: p.images && p.images.length ? p.images : p.image ? [p.image] : [placeholder],
          }));
        setRelated(filtered);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRelated();
  }, [product]);

  // Auto-slide hero image
  useEffect(() => {
    if (!images || images.length <= 1) return;
    if (sliderInterval.current) window.clearInterval(sliderInterval.current);
    sliderInterval.current = window.setInterval(() => {
      setMainIndex((i) => (i + 1) % images.length);
    }, 4500);
    return () => {
      if (sliderInterval.current) {
        window.clearInterval(sliderInterval.current);
        sliderInterval.current = null;
      }
    };
  }, [images]);

  // cart count from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart");
      if (!raw) return setCartCount(0);
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return setCartCount(0);
      setCartCount(arr.reduce((s: number, it: any) => s + (it.quantity || 0), 0));
    } catch {
      setCartCount(0);
    }
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val);

  // add to cart (localStorage)
  const addToCart = (qty = 1) => {
    if (!product) return;
    try {
      setIsAdding(true);
      const raw = localStorage.getItem("cart");
      const cart = raw ? JSON.parse(raw) : [];
      const idx = cart.findIndex((it: any) => it.id === product.id);
      if (idx >= 0) cart[idx].quantity = (cart[idx].quantity || 0) + qty;
      else
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          image: images[mainIndex] || placeholder,
        });
      localStorage.setItem("cart", JSON.stringify(cart));
      setCartCount(cart.reduce((s: number, i: any) => s + (i.quantity || 0), 0));
      setTimeout(() => setIsAdding(false), 500);
    } catch (err) {
      console.error(err);
      setIsAdding(false);
    }
  };

  const buyNow = () => {
    addToCart(1);
    router.push("/register");
  };

  // tilt 3D effect handlers (desktop)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element.
    const y = e.clientY - rect.top; // y position within the element.
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = (x - cx) / cx; // -1 .. 1
    const dy = (y - cy) / cy; // -1 .. 1
    const rotateY = dx * 8; // deg
    const rotateX = -dy * 8; // deg
    setTilt({ rotateX, rotateY, scale: 1.02 });
  };

  const resetTilt = () => setTilt({ rotateX: 0, rotateY: 0, scale: 1 });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
        <div className="text-sky-700">Memuat produk...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
        <div className="text-red-600">Produk tidak ditemukan</div>
      </div>
    );
  }

  const rating = Math.max(0, Math.min(5, product.rating ?? 4.6));
  const reviewsCount = product.reviewsCount ?? 0;

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      {/* Floating controls: back (left) and cart (right) */}
      <div className="fixed left-4 top-4 z-50">
        <button
          onClick={() => router.back()}
          aria-label="Kembali"
          className="flex items-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-md hover:bg-white rounded-xl shadow-md border border-white/40 transition"
        >
          <ArrowLeft size={18} className="text-sky-700" />
          <span className="text-sky-700 font-medium">Kembali</span>
        </button>
      </div>

      <div className="fixed right-4 top-4 z-50">
        <button
          onClick={() => router.push("/cart")}
          aria-label="Keranjang"
          className="relative flex items-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-md hover:bg-white rounded-xl shadow-md border border-white/40 transition"
        >
          <ShoppingCart size={18} className="text-sky-700" />
          <span className="sr-only">Keranjang</span>
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {cartCount}
          </span>
        </button>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* HERO IMAGE + THUMBS */}
          <div className="w-full">
            <motion.div
              ref={heroRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={resetTilt}
              style={{
                transform: `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.scale})`,
                transition: "transform 0.18s ease-out",
              }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden relative"
            >
              <img
                src={images[mainIndex] || placeholder}
                alt={product.name}
                className="w-full h-[520px] object-cover"
                onError={(e) => (e.currentTarget.src = placeholder)}
              />

              {/* rating glass overlay */}
              <div className="absolute left-4 bottom-4 bg-sky-900/75 text-white px-3 py-2 rounded-2xl flex items-center gap-3 backdrop-blur">
                <div className="text-sm font-semibold">{rating.toFixed(1)}</div>
                <div className="text-xs opacity-90">{reviewsCount} ulasan</div>
              </div>
            </motion.div>

            {/* thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainIndex(i)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                      i === mainIndex ? "border-sky-600" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = placeholder)} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div className="w-full flex flex-col gap-6">
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{product.name}</h1>
                  <div className="mt-2 flex items-center gap-3">
                    {product.category && <span className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-800 font-medium">{product.category}</span>}
                    {product.stock !== undefined && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.stock > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {product.stock > 0 ? `Stok ${product.stock}` : "Habis"}
                      </span>
                    )}
                  </div>
                </div>

                {/* price glossy card */}
                <div className="ml-auto">
                  <div className="bg-gradient-to-br from-sky-600 to-sky-500 text-white p-4 rounded-2xl shadow-lg text-right">
                    <div className="text-sm opacity-90">Harga</div>
                    <div className="text-2xl font-extrabold mt-1">{formatCurrency(product.price)}</div>
                    <div className="text-xs opacity-90 mt-1">Termasuk PPN jika ada</div>
                  </div>
                </div>
              </div>

              {/* description card */}
              <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm text-slate-800">
                <h3 className="font-semibold mb-2">Deskripsi Produk</h3>
                <p className="text-sm whitespace-pre-line">{product.description || "Tidak ada deskripsi."}</p>
              </div>
            </motion.div>

            {/* action buttons (desktop) */}
            <div className="hidden md:flex items-center gap-4 mt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(1)}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-full font-semibold shadow-md flex items-center justify-center gap-3"
              >
                <ShoppingCart size={18} />
                {isAdding ? "Menambahkan..." : "Tambah ke Keranjang"}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={buyNow}
                className="flex-1 bg-white border border-slate-200 hover:scale-[1.01] text-sky-700 py-3 rounded-full font-semibold shadow-sm flex items-center justify-center gap-3"
              >
                <CreditCard size={18} />
                Beli Sekarang
              </motion.button>
            </div>

            {/* related carousel */}
            {related.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">Produk Terkait</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const el = relatedRef.current;
                        if (!el) return;
                        el.scrollBy({ left: -240, behavior: "smooth" });
                      }}
                      className="p-2 bg-white rounded-md shadow-sm border"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => {
                        const el = relatedRef.current;
                        if (!el) return;
                        el.scrollBy({ left: 240, behavior: "smooth" });
                      }}
                      className="p-2 bg-white rounded-md shadow-sm border"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div
                  ref={relatedRef}
                  className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-2 px-2"
                >
                  {related.map((r) => {
                    const thumb = (r.images && r.images.length && r.images[0]) || r.image || placeholder;
                    return (
                      <motion.div
                        key={r.id}
                        whileHover={{ scale: 1.02 }}
                        className="snap-start w-44 bg-white rounded-2xl p-3 shadow-sm cursor-pointer flex-shrink-0"
                        onClick={() => router.push(`/products/${r.id}`)}
                      >
                        <img src={`${API_URL}${(thumb as string).startsWith("/") ? "" : "/"}${thumb}`} alt={r.name} className="w-full h-28 object-cover rounded-lg" onError={(e) => (e.currentTarget.src = placeholder)} />
                        <div className="mt-2 text-sm font-medium text-slate-900 line-clamp-2">{r.name}</div>
                        <div className="text-xs text-slate-600 mt-1">{formatCurrency(r.price)}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sticky mobile bottom actions */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="md:hidden fixed left-0 right-0 bottom-4 z-40 px-4"
        >
          <div className="max-w-3xl mx-auto flex gap-3">
            <button
              onClick={() => addToCart(1)}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-full font-semibold transition flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Tambah
            </button>

            <button
              onClick={buyNow}
              className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-sky-700 py-3 rounded-full font-semibold transition flex items-center justify-center gap-2"
            >
              <CreditCard size={18} />
              Beli
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}