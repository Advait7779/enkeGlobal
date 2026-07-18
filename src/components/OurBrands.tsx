const brands = [
  // Replace these with your real logo paths
  // Example:
  // { id: 1, name: "Nike", logo: "/brands/nike.png" },

  ...Array.from({ length: 52 }, (_, i) => ({
    id: i + 1,
    name: `Brand ${i + 1}`,
    logo: `/Brands/${i + 1}.png`,
  })),
];

export default function OurBrands() {
  return (
    <section className="py-20 bg-emerald-700">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Heading */}
        <div className="text-center text-white mb-14">
          <h2 className="text-4xl font-bold mb-4">Our Trusted Brands</h2>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto leading-relaxed">
            We proudly collaborate with 50+ leading brands to provide
            high-quality products and trusted solutions.
          </p>
        </div>

        {/* White Card Container */}
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 items-center">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-center p-1 transition duration-300 grayscale hover:grayscale-0 hover:scale-105"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="max-h-12 w-auto object-contain"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
