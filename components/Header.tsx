"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  name: string;
  role: string;
  email: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  if (!mounted) return null;

  return (
    <header className="
      sticky top-0 z-50 w-full
      flex justify-between items-center
      px-8 py-4
      bg-[#FFF8E1]/80 backdrop-blur-lg
      border-b border-[#E0C97A]
      shadow-sm
    ">
      {/* Logo / Nama Toko */}
      <h1 className="
        text-2xl font-extrabold
        bg-gradient-to-r from-[#FBC02D] to-[#F57C00]
        bg-clip-text text-transparent
        tracking-wide
      ">
        🍌 PisangRenyah
      </h1>

      <nav className="flex items-center gap-6">
        {!user ? (
          <>
            <Link
              href="/login"
              className="text-[#5D4037] font-semibold hover:text-[#F57C00] transition"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="
                bg-[#FBC02D] text-[#3E2723]
                px-4 py-1.5 rounded-lg
                shadow-sm
                hover:bg-[#F9A825]
                transition
                font-semibold
              "
            >
              Register
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <span className="
              text-[#3E2723] font-semibold
              bg-white/70 px-3 py-1
              rounded-full
              border border-[#E0C97A]
              shadow-sm
            ">
              {user.name}
              <span className="text-[#F57C00]"> ({user.role})</span>
            </span>

            <button
              onClick={handleLogout}
              className="
                bg-[#D84315] text-white
                px-3 py-1.5 rounded-lg
                shadow-sm
                hover:bg-[#BF360C]
                transition
                font-semibold
              "
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}