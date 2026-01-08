"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { API_URL } from "@/lib/api";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  const [loading, setLoading] = useState(false);

  // QRIS
  const [showQRIS, setShowQRIS] = useState(false);
  const [qrisCode, setQrisCode] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) router.push("/login");

    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  const totalPrice = cart.reduce(
    (acc, p) => acc + p.price * p.quantity,
    0
  );

  const fetchQR = () => {
    const driveImageUrl =
      "https://drive.google.com/file/d/1miIbSMHPMVaMH9RCSeoDWhrLalS4hpXf/view?usp=drivesdk";

    setQrisCode(driveImageUrl);
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
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    if (paymentMethod === "QRIS") {
      fetchQR();
    } else {
      handleCheckout();
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <Header />

      {/* POPUP QRIS */}
      {showQRIS && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center w-80">

            <h2 className="text-xl font-bold mb-2">QRIS Pembayaran</h2>
            <p className="text-gray-600 mb-4">Scan untuk bayar</p>

            <img src={qrisCode} className="w-56 h-56 mx-auto border rounded-lg" />

            <p className="mt-3 text-lg font-bold">
              Total: Rp {totalPrice.toLocaleString()}
            </p>

            <button
              onClick={handleCheckout}
              className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg"
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
        <h1 className="text-2xl font-bold mb-4">
          Checkout
        </h1>

        {/* PRODUK LIST */}
        <div className="bg-white p-4 rounded-xl shadow mb-4">
          <h3 className="text-xl font-semibold mb-3">Barang Dibeli</h3>

          {cart.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center border-b py-3"
            >
              <div className="flex gap-3 items-center">
                <img
                  src={`${API_URL}${p.image}`}
                  className="w-16 h-16 border rounded-md"
                />
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-gray-600">
                    {p.quantity} pcs
                  </p>
                </div>
              </div>

              <p className="font-semibold text-blue-600">
                Rp {(p.price * p.quantity).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* PEMBAYARAN */}
        <div className="bg-white p-4 rounded-xl shadow mb-4">
          <h3 className="text-xl font-semibold mb-3">
            Metode Pembayaran
          </h3>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-3 border bg-gray-50 rounded-lg"
          >
            <option value="Transfer Bank">Transfer Bank</option>
            <option value="COD">COD</option>
            <option value="E-Wallet">E-Wallet</option>
            <option value="QRIS">QRIS</option>
          </select>
        </div>

        {/* RINGKASAN */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-3">
            Ringkasan
          </h3>

          <div className="flex justify-between text-gray-700 mb-2">
            <span>Total Barang</span>
            <span>Rp {totalPrice.toLocaleString()}</span>
          </div>

          <div className="flex justify-between border-t pt-3 text-lg font-bold">
            <span>Total Bayar</span>
            <span className="text-green-600">
              Rp {totalPrice.toLocaleString()}
            </span>
          </div>

          <button
            disabled={loading}
            onClick={handlePay}
            className={`w-full mt-4 py-3 rounded-lg text-white font-bold ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
              }`}
          >
            {loading ? "Memproses..." : "Bayar Sekarang"}
          </button>
        </div>
      </div>
    </main>
  );
}