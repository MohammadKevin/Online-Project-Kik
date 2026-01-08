"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { API_URL } from "@/lib/api";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  const [loading, setLoading] = useState(false);

  // QRIS
  const [showQRIS, setShowQRIS] = useState(false);
  const [qrisCode, setQrisCode] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) router.push("/login");

    const stored = localStorage.getItem("cart");
    if (stored) {
      setCart(JSON.parse(stored) as CartItem[]);
    }
  }, []);

  const totalPrice = cart.reduce<number>(
    (acc, p) => acc + p.price * p.quantity,
    0
  );

  const fetchQR = () => {
    setQrisCode("/qris/qris.png"); // lebih aman pakai public
    setShowQRIS(true);
  };

  const handleCheckout = async () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return alert("Login dulu!");

    const user = JSON.parse(userStr);
    setLoading(true);

    const body = {
      userId: user.id,
      totalPrice,
      paymentMethod,
      items: cart.map((c) => ({
        productId: c.id,
        quantity: c.quantity,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.removeItem("cart");
      router.push("/dashboard/user");
    } catch (err: any) {
      alert(err.message || "Checkout gagal");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    paymentMethod === "QRIS" ? fetchQR() : handleCheckout();
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <Header />

      {/* QRIS POPUP */}
      {showQRIS && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center w-80">
            <h2 className="text-xl font-bold mb-2">QRIS Pembayaran</h2>
            <img src={qrisCode} className="w-56 h-56 mx-auto border rounded-lg" />
            <p className="mt-3 font-bold">
              Total: Rp {totalPrice.toLocaleString()}
            </p>
            <button
              onClick={handleCheckout}
              className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Saya Sudah Bayar
            </button>
            <button
              onClick={() => setShowQRIS(false)}
              className="w-full mt-2 py-2 bg-gray-300 rounded-lg"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* PAGE */}
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>

        <div className="bg-white p-4 rounded-xl shadow mb-4">
          {cart.map((p) => (
            <div key={p.id} className="flex justify-between py-3 border-b">
              <div className="flex gap-3">
                <img
                  src={`${API_URL}${p.image}`}
                  className="w-16 h-16 border rounded-md"
                />
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-gray-600">{p.quantity} pcs</p>
                </div>
              </div>
              <p className="font-bold text-green-600">
                Rp {(p.price * p.quantity).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <button
          disabled={loading}
          onClick={handlePay}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
        >
          {loading ? "Memproses..." : "Bayar Sekarang"}
        </button>
      </div>
    </main>
  );
}