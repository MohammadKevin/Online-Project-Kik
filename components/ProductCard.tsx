"use client";

import { API_URL } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
}

interface Props {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: Props) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col min-h-[480px]">
      <div className="w-full h-60 mb-3 flex justify-center items-center overflow-hidden rounded-lg bg-gray-50">
        <img src={`${API_URL}${product.image}`} alt={product.name} className="object-contain h-full" />
      </div>
      <h4 className="font-semibold text-lg">{product.name}</h4>
      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
      <p className="text-green-700 font-bold mt-auto text-lg">Rp {product.price.toLocaleString()}</p>
      <p className="text-gray-500 text-sm mt-1">Stok: {product.stock}</p>
      {onAddToCart && (
        <button
          onClick={() => onAddToCart(product)}
          className="mt-3 w-full bg-green-700 text-white p-2 rounded hover:bg-green-800 transition"
        >
          Tambah ke Keranjang
        </button>
      )}
    </div>
  );
}
