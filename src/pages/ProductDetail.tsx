import {
  Mail,
  Heart,
  Star,
  Truck,
  RotateCcw,
  Shield,
  ShoppingCart,
  CheckCircle,
  StarHalf,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import data from "../../Products.json";
import { normalizeProduct, type Product } from "../lib/products";

const products = Object.values(data).map(normalizeProduct);

const reviews = [
  {
    id: 1,
    name: "Rahul Mehta",
    company: "Mehta Engineering Works",
    rating: 5,
    title: "Excellent Quality & Reliable Service",
    review:
      "We have been purchasing electrical components from this company for over a year now. The product quality is outstanding and delivery is always on time.",
  },
  {
    id: 2,
    name: "Anita Sharma",
    company: "Sharma Industrial Solutions",
    rating: 5,
    title: "Best Supplier for Industrial Equipment",
    review:
      "We ordered mechanical tools and control panels for our factory, and everything met our expectations. The pricing is competitive and durable.",
  },
  {
    id: 3,
    name: "David Wilson",
    company: "Wilson Manufacturing Co.",
    rating: 5,
    title: "Professional & Trustworthy",
    review:
      "Their wide range of electrical and mechanical products helped us complete our project smoothly. Very professional company.",
  },
];

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "box">("description");
  const [cartToast, setCartToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const productId = Number.parseInt(id, 10);
    const fallbackProduct = products.find((item) => item.id === productId) || null;
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json() as Promise<unknown>;
      })
      .then((response) => {
        const parsed = normalizeProduct(response);
        if (parsed.id) {
          setProduct(parsed);
        } else {
          setProduct(fallbackProduct);
        }
      })
      .catch(() => {
        setProduct(fallbackProduct);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="animate-spin h-10 w-10 text-emerald-700 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading product...
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            The product you're looking for doesn't exist.
          </p>
          <a
            href="/shop"
            className="bg-emerald-700 text-white px-8 py-4 rounded-lg font-medium hover-bg-blue"
          >
            Back to Shop
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-96"
            />
          </div>

          <div className="space-y-6">
            <div>
              <div className="inline-block bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
                {product.category}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => {
                    const ratingValue = i + 1;
                    const isFull = ratingValue <= Math.floor(product.rating);
                    const isHalf = !isFull && (ratingValue - 0.5 <= product.rating);
                    return isFull ? (
                      <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                    ) : isHalf ? (
                      <StarHalf key={i} size={18} className="fill-amber-400 text-amber-400" />
                    ) : (
                      <Star key={i} size={18} className="text-gray-300" />
                    );
                  })}
                </div>
                <span className="text-gray-600">
                  ({product.reviews} reviews)
                </span>
                {product.inStock && (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    In Stock
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-b border-gray-200 py-6">
              {product.badge && (
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    {product.badge}
                  </span>
                </div>
              )}
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-20 text-center border border-gray-300 px-4 py-2 rounded-lg"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {product.name === "A5 DEVICE" && (
                <div className="mb-4">
                  <select className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white focus:outline-none focus:border-emerald-500">
                    <option>1 Year</option>
                  </select>
                </div>
              )}

              <div className="flex gap-4">
                {product.name === "A5 DEVICE" ? (
                  <button
                    onClick={() => {
                      setCartToast(true);
                      setTimeout(() => setCartToast(false), 3000);
                    }}
                    className="flex-1 bg-[#1e293b] hover:bg-slate-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={24} />
                    Add To Cart
                  </button>
                ) : (
                  <button
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-4 rounded-lg font-medium text-lg transition-colors flex items-center justify-center gap-2"
                    onClick={() =>
                      navigate("/contact", {
                        state: {
                          product: {
                            id: product.id,
                            name: product.name,
                            image: product.image,
                            category: product.category,
                          },
                          quantity,
                        },
                      })
                    }
                  >
                    <Mail size={24} />
                    Enquire Now
                  </button>
                )}
                <button className="border border-gray-300 text-gray-700 px-6 py-4 rounded-lg font-medium hover:border-emerald-700 hover:text-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <Heart size={24} />
                  Wishlist
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Truck
                  size={20}
                  className="text-emerald-700 flex-shrink-0 mt-1"
                />
                <div>
                  <h4 className="font-medium text-gray-900">Free Shipping</h4>
                  <p className="text-sm text-gray-600">On orders above $5000</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <RotateCcw
                  size={20}
                  className="text-emerald-700 flex-shrink-0 mt-1"
                />
                <div>
                  <h4 className="font-medium text-gray-900">30-Day Returns</h4>
                  <p className="text-sm text-gray-600">No questions asked</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Shield
                  size={20}
                  className="text-emerald-700 flex-shrink-0 mt-1"
                />
                <div>
                  <h4 className="font-medium text-gray-900">Warranty</h4>
                  <p className="text-sm text-gray-600">2-year coverage</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs block specifically for the A5 DEVICE */}
        {product.name === "A5 DEVICE" && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <div className="flex gap-8 border-b border-gray-200 mb-8 text-lg font-semibold">
              <button
                onClick={() => setActiveTab("description")}
                className={`pb-4 transition-colors relative ${
                  activeTab === "description" ? "text-slate-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Description
                {activeTab === "description" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("box")}
                className={`pb-4 transition-colors relative ${
                  activeTab === "box" ? "text-slate-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                What's in the Box
                {activeTab === "box" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                )}
              </button>
            </div>

            {activeTab === "description" && (
              <div className="space-y-6">
                <div className="space-y-4 text-sm text-gray-600 leading-relaxed font-normal">
                  <p>
                    <strong className="text-gray-800 font-bold">Anti-theft Protection:-</strong> Receive Anti-theft Alerts on your phone to prevent vehicle theft, triggered by ignition activation, towing, pushing, or removal of the device wire.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-bold">Live Tracking & History:-</strong> Live GPS Tracking with Ride History feature provides accurate location tracking of your car/bike, including motion tracking even when the Engine is turned OFF.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-bold">Connectivity & Alerts:-</strong> ADVAIT GPS Tracker comes with an in-built SIM Card and AI Alerts on the Advait app, ensuring constant connectivity with your vehicle.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-bold">OverSpeed Alerts:-</strong> Immediate notifications sent to owners or fleet managers via SMS, email, or app push notifications.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-bold">Geo-fence Alerts:-</strong> Set up Geo-fence Alerts to create geofences around frequented locations and receive instant notifications when the vehicle enters or exits them.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-bold">Vehicle Movement Alarm + Overvoltage Protection:</strong> Alerts unauthorized vehicle movement. Prevents damage from excess voltage.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-bold">History Records:-</strong> The 90-day GPS history provides a detailed record of a person's or device's movements over the past 90 days, including precise locations, timestamps, and travel routes.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-bold">Custom Alerts & Monitoring:-</strong> Customize alerts and remotely monitor vehicle safety with Advait GPS Tracker, including features like sharp turns, overspeeding, harsh acceleration, harsh braking, and more.
                  </p>
                </div>

                {/* Specs Table */}
                <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden max-w-2xl">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td className="px-6 py-3 font-bold text-gray-800 w-1/3">Dimensions</td>
                        <td className="px-6 py-3 text-gray-600">L: 15 x B: 16 x H: 17</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-3 font-bold text-gray-800">Weight</td>
                        <td className="px-6 py-3 text-gray-600">125</td>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td className="px-6 py-3 font-bold text-gray-800">SKU Code</td>
                        <td className="px-6 py-3 text-gray-600">85269190</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-3 font-bold text-gray-800">Tax Code</td>
                        <td className="px-6 py-3 text-gray-600">—</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-3 font-bold text-gray-800">Color</td>
                        <td className="px-6 py-3 text-gray-600">Black</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "box" && (
              <ul className="space-y-4">
                {["GPS", "WIRE", "SIM CARD", "MANUAL"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                    <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Customer Reviews
          </h2>
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-200 pb-6 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{review.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {[...Array(review.rating)].map((_, idx) => (
                        <Star
                          key={idx}
                          size={14}
                          className="fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    Verified Customer
                  </span>
                </div>
                <p className="text-gray-600">{review.review}</p>
                <p className="text-sm text-gray-500 mt-2">{review.company}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {cartToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#1e293b] text-white px-6 py-3 rounded-lg shadow-xl font-semibold flex items-center gap-2 border border-slate-700 animate-scale-up">
          <CheckCircle size={20} className="text-emerald-500" />
          Product added to cart successfully!
        </div>
      )}
    </main>
  );
}
