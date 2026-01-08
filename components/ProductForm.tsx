"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";

interface Props {
  onAdd: (product: any) => void;
}

export default function ProductForm({ onAdd }: Props) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    image: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) return alert("Pilih gambar!");

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("category", form.category);
    formData.append("stock", form.stock);
    formData.append("image", form.image);

    try {
      const res = await fetch(`${API_URL}/api/products`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Gagal menambahkan produk");

      alert("Produk berhasil ditambahkan!");
      setForm({ name:"", description:"", price:"", category:"", stock:"", image:null });
      onAdd(data.product);
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan produk");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-8 max-w-md">
      <h3 className="text-xl font-bold mb-4">Tambah Produk Baru</h3>
      <input type="text" placeholder="Nama" value={form.name} onChange={e => setForm({...form, name:e.target.value})} className="w-full mb-2 p-2 border rounded" required />
      <textarea placeholder="Deskripsi" value={form.description} onChange={e => setForm({...form, description:e.target.value})} className="w-full mb-2 p-2 border rounded" required />
      <input type="number" placeholder="Harga" value={form.price} onChange={e => setForm({...form, price:e.target.value})} className="w-full mb-2 p-2 border rounded" required />
      <input type="text" placeholder="Kategori" value={form.category} onChange={e => setForm({...form, category:e.target.value})} className="w-full mb-2 p-2 border rounded" required />
      <input type="number" placeholder="Stok" value={form.stock} onChange={e => setForm({...form, stock:e.target.value})} className="w-full mb-2 p-2 border rounded" required />
      <input type="file" onChange={e => setForm({...form, image:e.target.files ? e.target.files[0]: null})} className="w-full mb-4" required />
      <button type="submit" className="w-full bg-green-700 text-white p-2 rounded hover:bg-green-800 transition">Tambah Produk</button>
    </form>
  );
}
