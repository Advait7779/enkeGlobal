import { Search, Phone, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <header className="w-full sticky top-0 z-50">
      <div className="bg-emerald-700 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <a href="tel:+234-8147526350" className="flex items-center gap-2">
              <Phone size={16} />
              <span>+234-8147526350</span>
            </a>
            <a
              href="mailto:enkenterprises2024@gmail.com"
              className="flex items-center gap-2"
            >
              <Mail size={16} />
              <span>enkenterprises2024@gmail.com</span>
            </a>
          </div>
          <div className="hidden md:flex justify-end flex-1">
            <div className="w-full max-w-[418px] text-left">
              Established 2024 - Your Trusted Industrial Equipment Partner
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-8">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80">
              {/* <img
                src={logo} // place your image in the public folder
                alt="eNKe Global Enterprises Logo"
                width={70}
                height={70}
                className="object-contain"
              /> */}

              <div>
                <div className="text-emerald-700 font-bold text-3xl">
                  eNKe Global Enterprises
                </div>
                <div className="text-sm text-gray-600 hidden lg:block">
                  LIMITED
                </div>
              </div>
            </Link>

            <div className="flex-1 justify-end hidden md:flex">
              <form onSubmit={handleSearchSubmit} className="w-full max-w-[418px]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-md transition-colors">
                    <Search size={16} />
                  </button>
                </div>
              </form>
            </div>

            {/* Login account and view cart */}
            {/* <div className="flex items-center gap-4">
              <button className="hidden md:flex items-center gap-2 text-gray-700 hover-blue">
                <User size={24} />
                <span className="text-sm">Account</span>
              </button>
              <button className="relative flex items-center gap-2 text-gray-700 hover-blue">
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-emerald-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </button>
              <button className="md:hidden text-gray-700">
                <Menu size={24} />
              </button>
            </div> */}
          </div>
        </div>

        <nav className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex items-center justify-center gap-8 py-3 overflow-x-auto">
              <li>
                <Link
                  to="/"
                  className="text-gray-700 hover-blue font-medium whitespace-nowrap"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/shop"
                  className="text-gray-700 hover-blue font-medium whitespace-nowrap"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-700 hover-blue font-medium whitespace-nowrap"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-700 hover-blue font-medium whitespace-nowrap"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}
