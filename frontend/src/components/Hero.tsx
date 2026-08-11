import { Link } from "react-router-dom";

import logo from "../../public/RequiredImages/Logo.jpeg";

export default function Hero() {

  return (
    <section className="relative  py-3">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-medium">
              We are here for
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              <span className="block text-emerald-700">
                Engineering Spares, Components or Critical Parts
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Dependable Express Solutions build to power uptime and
              productivity for your business. We are your trusted partner for
              sourcing and delivering high-quality engineering spares,
              components, and critical parts with speed and reliability.
            </p>
            <div className="flex gap-4 pt-4">
              <Link
                to="/about"
                className="border-2 border-blue-300 text-gray-700 px-8 py-4 rounded-lg font-medium text-lg hover-border-blue hover-blue transition-colors inline-block"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl overflow-hidden">
              <img
                src={logo}
                alt="eNKe Global Enterprises - Industrial Equipment & Engineering Spares"
                className="w-full h-auto object-cover aspect-[10/10]"
              />
            </div>
          </div>
        </div>
      </div>
      {/* <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-medium">
              New Arrival
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              <span className="block text-emerald-700">{heroData.name}</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              {heroData.description}
            </p>
            <div className="flex gap-4 pt-4">
              <Link
                to="/shop"
                className="bg-emerald-700 text-white px-8 py-4 rounded-lg font-medium text-lg hover-bg-blue transition-colors inline-block"
              >
                Shop Now
              </Link>
              <Link
                to="/about"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-medium text-lg hover-border-blue hover-blue transition-colors inline-block"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <img
                src={heroData.image}
                alt="Forklift"
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </div> */}

      {/* Buttons below the card */}
      {/* <div className="absolute bottom-8 right-8 flex gap-2">
        <button className="bg-white p-3 rounded-full shadow-lg hover-bg-blue hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <button className="bg-white p-3 rounded-full shadow-lg hover-bg-blue hover:text-white transition-colors">
          <ChevronRight size={24} />
        </button>
      </div> */}
    </section>
  );
}
