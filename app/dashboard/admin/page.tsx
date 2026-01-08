"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/api";

export default function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("semua");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    image: null as File | null,
  });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user || JSON.parse(user).role !== "admin") router.push("/login");
  }, [router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching:", err);
      }
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("category", form.category);
    formData.append("stock", form.stock);
    if (form.image) formData.append("image", form.image);

    const url = editingProductId
      ? `${API_URL}/products/${editingProductId}`
      : `${API_URL}/products`;
    const method = editingProductId ? "PUT" : "POST";

    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    if (!res.ok) return alert(data.message || "Gagal menyimpan");

    if (editingProductId) {
      setProducts((p) => p.map((x) => (x.id === editingProductId ? data : x)));
      setEditingProductId(null);
    } else setProducts((p) => [...p, data]);

    setForm({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "",
      image: null,
    });
    alert("Produk berhasil disimpan!");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    const res = await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert("Produk dihapus!");
    }
  };

  const handleEdit = (p: any) => {
    setForm({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      category: p.category,
      stock: p.stock.toString(),
      image: null,
    });
    setEditingProductId(p.id);
  };

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "semua" || p.category === filter)
  );

  return (
    <main className="min-h-screen flex bg-gradient-to-br from-blue-50 to-blue-100 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-700 to-blue-800 text-white flex flex-col justify-between p-6 shadow-2xl">
        <div>
          <h2 className="text-2xl font-extrabold mb-8 tracking-wide drop-shadow">
            Admin Panel 🧩
          </h2>

          <nav className="space-y-3">
            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
              onClick={() => router.push("/admin")}
            >
              🛒 Produk
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
              onClick={() => router.push("/admin/orders")}
            >
              📦 Pesanan
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
              onClick={() => router.push("/admin/statistik")}
            >
              📊 Statistik
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
              onClick={() => router.push("/dashboard/admin/qris")}
            >
              🔳 QRIS Manager
            </button>
          </nav>
        </div>

        <button
          onClick={() => router.push("/")}
          className="bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 font-semibold backdrop-blur-md transition"
        >
          Keluar ↩
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 p-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-blue-800 mb-8 drop-shadow"
        >
          Dashboard Produk
        </motion.h1>

        {/* Form Produk */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl border border-blue-200 p-8 max-w-xl mb-10"
        >
          <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">
            {editingProductId ? "Edit Produk" : "Tambah Produk"}
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nama Produk"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <textarea
              placeholder="Deskripsi"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Harga"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <input
                type="number"
                placeholder="Stok"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Kategori"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <input
              type="file"
              onChange={(e) =>
                setForm({
                  ...form,
                  image: e.target.files ? e.target.files[0] : null,
                })
              }
              className="w-full p-2 border border-blue-200 rounded-lg bg-blue-50"
            />

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold hover:shadow-xl transition-all"
            >
              {editingProductId ? "Simpan Perubahan" : "+ Tambah Produk"}
            </button>
          </div>
        </motion.form>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-3">
          <input
            type="text"
            placeholder="🔍 Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none flex-1"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="semua">Semua Kategori</option>
            {[...new Set(products.map((p) => p.category ?? ""))].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Products */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {filtered.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.035 }}
              className="bg-white/80 backdrop-blur-xl border border-blue-200 rounded-2xl shadow-md hover:shadow-blue-300 transition-all flex flex-col justify-between p-5"
            >
              <div>
                <img
                  src={`${API_URL}${product.image}`}
                  alt={product.name}
                  className="h-52 w-full object-contain rounded-lg mb-4"
                />
                <h3 className="font-bold text-lg text-blue-800">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {product.description}
                </p>
                <p className="font-bold text-blue-600 text-lg">
                  Rp {Number(product.price).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 font-semibold transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold transition"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}