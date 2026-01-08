"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { API_URL } from "@/lib/api";
import { motion } from "framer-motion";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role: "customer" }),
    });

    const raw = await res.text(); // baca body sekali
    let data: Record<string, unknown> | null = null;

    try {
      data = JSON.parse(raw); // coba parse JSON
    } catch {
      console.error("Response bukan JSON:", raw);
      setError("Server tidak merespon dengan format yang benar.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError((data?.["message"] as string) || "Register gagal");
      setLoading(false);
      return;
    }

    const user = data?.["user"] as User | undefined;
    if (!user) {
      setError("Data user tidak valid dari server.");
      setLoading(false);
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));
    router.push("/dashboard/user");
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi.";
    setError(message);
  } finally {
    setLoading(false);
  }
};


  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Header />

      {/* Section utama */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.form
          onSubmit={handleRegister}
          className="bg-white/70 backdrop-blur-xl border border-blue-100 p-8 rounded-2xl shadow-xl w-full max-w-md text-black transition-all hover:shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-800">
            Buat Akun Baru
          </h2>

          <p className="text-center text-gray-600 mb-6 text-sm">
            Daftar sekarang dan nikmati pengalaman belanja terbaik di{" "}
            <span className="font-semibold text-blue-700">Toko Madura</span>
          </p>

          {error && (
            <motion.p
              className="text-red-600 mb-4 text-center font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              required
            />

            <input
              type="email"
              placeholder="Alamat Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              required
            />

            <input
              type="password"
              placeholder="Kata Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              required
            />
          </div>

          <motion.button
            type="submit"
            className={`w-full mt-6 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 hover:shadow-lg transition-transform transform hover:-translate-y-0.5 ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </motion.button>

          <p className="text-sm text-gray-600 mt-6 text-center">
            Sudah punya akun?{" "}
            <a
              href="/login"
              className="text-blue-700 font-semibold hover:underline"
            >
              Login di sini
            </a>
          </p>
        </motion.form>
      </div>

      <footer className="text-center text-gray-500 py-6 text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="text-blue-700 font-semibold">Toko Madura</span>. Semua
        hak dilindungi.
      </footer>
    </main>
  );
}