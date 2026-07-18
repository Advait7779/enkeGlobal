import { Link } from "react-router-dom";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-emerald-700 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It may have been moved, renamed, or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Go Home
          </Link>
          <Link
            to="/shop"
            className="border border-emerald-700 text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Search size={20} />
            Browse Products
          </Link>
        </div>
        <button
          onClick={() => window.history.back()}
          className="mt-6 text-gray-500 hover:text-emerald-700 transition-colors flex items-center gap-1.5 mx-auto text-sm"
        >
          <ArrowLeft size={16} />
          Go back
        </button>
      </div>
    </main>
  );
}
