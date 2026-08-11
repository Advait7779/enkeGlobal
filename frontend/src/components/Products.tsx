import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Eye, Star } from "lucide-react";

import data from "../data/products.json";
import { apiUrl, assetUrl } from "../lib/api";
import { normalizeProduct, type Product } from "../lib/products";

const fallbackProducts = Object.values(data).map(normalizeProduct);

export default function Products() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts.slice(0, 9));
  const navigate = useNavigate();

  useEffect(() => {
    fetch(apiUrl("/api/products?limit=9"))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json() as Promise<{ products?: unknown[] }>;
      })
      .then((response) => {
        if (response.products && response.products.length > 0) {
          const parsed = response.products.map(normalizeProduct);
          setProducts(parsed);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Discover our best-selling industrial equipment
          </p>

          {/* <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => setActiveTab("featured")}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === "featured"
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Featured
            </button>
            <button
              onClick={() => setActiveTab("bestsellers")}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === "bestsellers"
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Best Sellers
            </button>
            <button
              onClick={() => setActiveTab("sale")}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === "sale"
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              On Sale
            </button>
          </div> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.slice(0, 9).map((product, idx) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100/80 overflow-hidden group hover:shadow-2xl hover:-translate-y-2 hover:border-emerald-700/20 transition-all duration-300 animate-slide-up opacity-0"
              style={{ animationDelay: `${Math.min(idx * 40, 400)}ms`, animationFillMode: "forwards" }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={assetUrl(product.image)}
                  alt={product.name}
                  className="w-full h-64 group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                />
                <div
                  className={`absolute top-4 left-4 ${product.badgeColor} text-white px-3 py-1 rounded-full text-sm font-medium`}
                >
                  {product.badge}
                </div>
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="bg-white p-2 rounded-full shadow-lg hover:bg-emerald-700 hover:text-white transition-colors">
                    <Heart size={20} />
                  </button>
                  <button className="bg-white p-2 rounded-full shadow-lg hover:bg-emerald-700 hover:text-white transition-colors">
                    <Eye size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < Math.floor(product.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    ({product.reviews})
                  </span>
                </div>

                <h3
                  className="text-lg font-bold text-gray-900 mb-3 group-hover:text-emerald-700 cursor-pointer transition-colors duration-300"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {product.name}
                </h3>

              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/shop"
            className="bg-emerald-700 text-white px-8 py-4 rounded-lg font-medium text-lg hover-bg-blue transition-colors inline-block"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
