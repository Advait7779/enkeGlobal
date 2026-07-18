import { Zap, Box, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

import Electronic from "../../public/RequiredImages/Electronic Category.jpeg";
import Electrical from "../../public/RequiredImages/Electrical Category.png";
import Mechanical from "../../public/RequiredImages/Mechanica Category.png";

const categories = [
  {
    name: "Electrical",
    icon: Zap,
    count: 32,
    image:Electrical,
  },
  {
    name: "Mechanical",
    icon: Wrench,
    count: 124,
    image:Mechanical,
  },
  {
    name: "Electronic",
    icon: Box,
    count: 28,
    image: Electronic,
  },
];

export default function Categories() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Product Categories
          </h2>
          <p className="text-xl text-gray-600">
            Browse our wide range of industrial equipment and materials
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link
                key={index}
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="group relative overflow-hidden rounded-xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 block"
              >
                <div className="relative h-64">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-emerald-700 p-2 rounded-lg">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{category.name}</h3>
                      {/* Product Count */}
                      {/* <p className="text-sm text-gray-300">
                        {category.count} Products
                      </p> */}
                    </div>
                  </div>
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white font-medium">View All →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
