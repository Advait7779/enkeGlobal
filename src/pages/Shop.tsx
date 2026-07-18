import { Heart, Eye, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import data from "../../Products.json";
import { normalizeProduct, type Product } from "../lib/products";

const DEFAULT_CATEGORIES = ["Electrical", "Electronic", "Mechanical"];

const fallbackProducts = Object.values(data).map(normalizeProduct);

// Backup random data
// [
//   {
//     id: 1,
//     name: "Atlas Copco Diesel Engine 150HP",
//     price: 18999,
//     oldPrice: 21999,
//     rating: 4.8,
//     reviews: 24,
//     image:
//       "https://images.pexels.com/photos/2226458/pexels-photo-2226458.jpeg?auto=compress&cs=tinysrgb&w=600",
//     badge: "Sale",
//     badgeColor: "bg-red-500",
//     category: "Diesel Engines",
//   },
//   {
//     id: 2,
//     name: "Industrial Generator 50KVA",
//     price: 12500,
//     rating: 4.9,
//     reviews: 18,
//     image:
//       "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=600",
//     badge: "Featured",
//     badgeColor: "bg-emerald-700",
//     category: "Generators",
//   },
//   {
//     id: 3,
//     name: "Forklift 2.5 Ton Diesel",
//     price: 22999,
//     rating: 4.7,
//     reviews: 31,
//     image:
//       "https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?auto=compress&cs=tinysrgb&w=600",
//     badge: "New",
//     badgeColor: "bg-blue-500",
//     category: "Forklifts",
//   },
//   {
//     id: 4,
//     name: "Marine Plywood 18mm Premium",
//     price: 85,
//     oldPrice: 95,
//     rating: 4.6,
//     reviews: 42,
//     image:
//       "https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=600",
//     badge: "Sale",
//     badgeColor: "bg-red-500",
//     category: "Marine Plywood",
//   },
//   {
//     id: 5,
//     name: "Hydraulic Pump System",
//     price: 3499,
//     rating: 4.9,
//     reviews: 15,
//     image:
//       "https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=600",
//     badge: "Featured",
//     badgeColor: "bg-emerald-700",
//     category: "Spare Parts",
//   },
//   {
//     id: 6,
//     name: "Heavy Duty Air Compressor",
//     price: 5999,
//     rating: 4.8,
//     reviews: 27,
//     image:
//       "https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=600",
//     badge: "Best Seller",
//     badgeColor: "bg-amber-500",
//     category: "Spare Parts",
//   },
//   {
//     id: 7,
//     name: "Diesel Engine 100HP Industrial",
//     price: 14999,
//     rating: 4.7,
//     reviews: 19,
//     image:
//       "https://images.pexels.com/photos/2226458/pexels-photo-2226458.jpeg?auto=compress&cs=tinysrgb&w=600",
//     badge: "Featured",
//     badgeColor: "bg-emerald-700",
//     category: "Diesel Engines",
//   },
//   {
//     id: 8,
//     name: "Forklift 3 Ton Diesel",
//     price: 24999,
//     rating: 4.9,
//     reviews: 35,
//     image:
//       "https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?auto=compress&cs=tinysrgb&w=600",
//     badge: "New",
//     badgeColor: "bg-blue-500",
//     category: "Forklifts",
//   },
//   {
//     id: 9,
//     name: "Marine Plywood 12mm Standard",
//     price: 65,
//     rating: 4.5,
//     reviews: 28,
//     image:
//       "https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=600",
//     badge: "Sale",
//     badgeColor: "bg-red-500",
//     category: "Marine Plywood",
//   },
// ];

export default function Shop() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const searchQuery = searchParams.get("search");
  const [sortBy] = useState("featured");

  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/products?limit=250")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json() as Promise<{ products?: unknown[] }>;
      })
      .then((response) => {
        if (response.products && response.products.length > 0) {
          const parsed = response.products.map(normalizeProduct);
          setProducts(parsed);

          // Dynamically gather unique categories from loaded products
          const uniqueCats = Array.from(new Set(parsed.map(p => p.category).filter(Boolean)));
          setCategories(prev => Array.from(new Set([...prev, ...uniqueCats])));
        }
      })
      .catch(() => {});
  }, []);

  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      !selectedCategory || product.category === selectedCategory;
    const searchMatch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Shop Products
            </h1>
            <p className="text-lg text-gray-600">
              Browse our complete catalog of industrial equipment
            </p>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Showing {sortedProducts.length} products{" "}
            {selectedCategory && `in ${selectedCategory}`}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 lg:sticky lg:top-[185px] self-start">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Categories
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/shop"
                      className={`block px-4 py-2 rounded-lg transition-colors ${!selectedCategory ? "bg-emerald-700 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      All Products
                    </a>
                  </li>
                  {categories.map((category) => (
                    <li key={category}>
                      <a
                        href={`/shop?category=${encodeURIComponent(category)}`}
                        className={`block px-4 py-2 rounded-lg transition-colors ${selectedCategory === category ? "bg-emerald-700 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                      >
                        {category}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-100/80 overflow-hidden group hover:shadow-2xl hover:-translate-y-2 hover:border-emerald-700/20 transition-all duration-300 animate-slide-up opacity-0"
                  style={{ animationDelay: `${Math.min(idx * 40, 400)}ms`, animationFillMode: "forwards" }}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
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

            {sortedProducts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-gray-600">
                  No products found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
