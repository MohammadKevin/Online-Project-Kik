"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login gagal");
        return;
      }

      const user = data.user || data;

      if (!user.id) {
        setError("ID user tidak ditemukan, cek backend login response");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/user");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Terjadi kesalahan, coba lagi.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white text-black">
      <Header />
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200"
        >
          <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-800">
            Selamat Datang 👋
          </h2>

          {error && (
            <p className="text-red-600 mb-4 text-center font-medium bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                Email
              </label>
              <input
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                Password
              </label>
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold p-3 rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              Login
            </button>

            <p className="text-sm text-center text-gray-700 mt-4">
              Belum punya akun?{" "}
              <a
                href="/register"
                className="text-blue-700 font-semibold hover:underline"
              >
                Daftar Sekarang
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}