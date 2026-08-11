import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <h3 className="text-white text-2xl font-bold mb-4">
              eNKe Global Enterprises
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Leading supplier of industrial equipment and construction
              materials since 2024. Your trusted partner for quality and
              reliability.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/"
                className="bg-gray-800 p-2 rounded-lg hover-bg-blue transition-colors"
                target="_blank"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://x.com/"
                className="bg-gray-800 p-2 rounded-lg hover-bg-blue transition-colors"
                target="_black"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://in.linkedin.com/"
                className="bg-gray-800 p-2 rounded-lg hover-bg-blue transition-colors"
                target="_black"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://www.instagram.com/"
                className="bg-gray-800 p-2 rounded-lg hover-bg-blue transition-colors"
                target="_blank"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className=" transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/shop" className=" transition-colors">
                  Our Products
                </Link>
              </li>
              <li>
                <Link to="/contact" className=" transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-lg font-bold mb-4">
              Product Categories
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/shop?category=Electronic"
                  className=" transition-colors"
                >
                  Electronic
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=Mechanical"
                  className=" transition-colors"
                >
                  Mechanical
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=Electrical"
                  className=" transition-colors"
                >
                  Electrical
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-lg font-bold mb-4">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin
                  size={20}
                  className="text-emerald-700 mt-1 flex-shrink-0"
                />
                <span>
                  8, Marks Street, Singer Sango Ogun State, Ijako Sugar Sango,
                  Ogun State, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-emerald-700 flex-shrink-0" />
                <a href="tel:+234-8147526350" className="">
                  +234-8147526350
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle size={20} className="text-emerald-700 flex-shrink-0" />
                <a
                  href="https://wa.me/2347063633299"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover-blue"
                >
                  +234-7063633299
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-emerald-700 flex-shrink-0" />
                <a href="mailto:enkenterprises2024@gmail.com" className="">
                  enkenterprises2024@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-gray-400">
              &copy; 2026 eNKe Global Enterprises. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className=" transition-colors">
                Privacy Policy
              </a>
              <a href="#" className=" transition-colors">
                Terms of Service
              </a>
              <a href="#" className="transition-colors">
                Shipping Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
