"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/api";

export default function QRISManager() {
  const router = useRouter();

  const [files, setFiles] = useState<string[]>([]);
  const [randomQR, setRandomQR] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user || JSON.parse(user).role !== "admin") router.push("/login");

    fetchFiles();
  }, [router]);

  const fetchFiles = async () => {
    const res = await fetch(`${API_URL}/api/qris/random`); // test untuk random
    await fetchList(); // muat list
  };

  const fetchList = async () => {
    const res = await fetch(`${API_URL}/uploads/qris`);
  };

  // karena tidak ada API untuk list semua file, kita bikin sendiri:
  const loadFiles = async () => {
    const res = await fetch(`${API_URL}/api/qris/list`);
    const data = await res.json();
    setFiles(data.files || []);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async () => {
    if (!uploadFile) return alert("Pilih file dulu!");

    const formData = new FormData();
    formData.append("qris", uploadFile);

    const res = await fetch(`${API_URL}/api/qris/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert("QRIS berhasil diupload!");
    setUploadFile(null);
    loadFiles();
  };

  const getRandom = async () => {
    const res = await fetch(`${API_URL}/api/qris/random`);
    const data = await res.json();
    setRandomQR(data.url);
  };

  const deleteQR = async (name: string) => {
    if (!confirm("Yakin hapus QR ini?")) return;

    const res = await fetch(`${API_URL}/api/qris/delete/${name}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("QR dihapus!");
      loadFiles();
    }
  };

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
              className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              onClick={() => router.push("/dashboard/admin")}
            >
              🛒 Produk
            </button>

            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              onClick={() => router.push("/dashboard/admin/orders")}
            >
              📦 Pesanan
            </button>

            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              onClick={() => router.push("/dashboard/admin/statistik")}
            >
              📊 Statistik
            </button>

            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-white/20 border border-white/30 transition"
            >
              🔳 QRIS Manager
            </button>
          </nav>
        </div>

        <button
          onClick={() => router.push("/")}
          className="bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 font-semibold transition"
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
          QRIS Manager
        </motion.h1>

        {/* Upload QR */}
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl max-w-lg shadow border border-blue-200">
          <h2 className="font-bold text-xl mb-4 text-blue-600">Upload QRIS Baru</h2>

          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="w-full p-2 rounded-lg border border-blue-200 bg-blue-50"
          />

          <button
            onClick={handleUpload}
            className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold hover:shadow-lg"
          >
            Upload QRIS
          </button>
        </div>

        {/* QR Random */}
        <div className="mt-10">
          <button
            onClick={getRandom}
            className="px-5 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
          >
            Ambil QRIS Random
          </button>

          {randomQR && (
            <div className="mt-4">
              <img
                src={`${API_URL}${randomQR}`}
                className="w-64 rounded-xl shadow"
              />
            </div>
          )}
        </div>

        {/* List Semua QR */}
        <h2 className="text-2xl font-bold mt-10 mb-4 text-blue-700">
          Semua File QRIS
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {files.map((f) => (
            <div
              key={f}
              className="bg-white/70 p-4 rounded-xl border shadow flex flex-col items-center"
            >
              <img
                src={`${API_URL}/qris/${f}`}
                className="w-32 h-32 object-contain rounded"
              />

              <p className="text-sm mt-2">{f}</p>

              <button
                onClick={() => deleteQR(f)}
                className="mt-3 py-1 px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
