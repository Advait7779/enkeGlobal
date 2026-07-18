import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Mail, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const showLogoutToast = localStorage.getItem("enke_show_logout_toast");
    if (showLogoutToast === "true") {
      setToast({ message: "Logged out successfully", type: "success" });
      localStorage.removeItem("enke_show_logout_toast");
      setTimeout(() => setToast(null), 3500);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem("enke_admin_token", data.token);
      localStorage.setItem("enke_show_login_toast", "true");
      navigate("/admin");
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex relative animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-lg shadow-xl text-white text-sm font-bold bg-emerald-600 border border-emerald-500 transition-all transform duration-300">
          <CheckCircle size={16} />
          {toast.message}
        </div>
      )}
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow blob */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-600 opacity-10 blur-3xl" />

        <div className="relative text-center">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">eNKe Global Enterprises</h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-3">LIMITED</p>

          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[
              { value: "105+", label: "Products" },
              { value: "100%", label: "Secure" },
              { value: "24/7", label: "Access" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">{stat.value}</div>
                <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-[380px] bg-white border border-gray-300 rounded-lg shadow-xl px-8 py-10 flex flex-col animate-slide-up">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="flex flex-col">
                <span className="text-base font-black text-gray-900 leading-tight">eNKe Global Enterprises</span>
                <span className="text-[9px] font-bold text-gray-500 tracking-widest">LIMITED</span>
              </div>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-xs font-medium">Sign in to your admin account to continue.</p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@enkeglobal.com"
                  autoComplete="email"
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg pl-11 pr-12 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-emerald-700 hover:hover-bg-blue text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Sign In to Admin Panel
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-[10px] font-semibold tracking-wider mt-8 uppercase">
            eNKe Global Enterprises © {new Date().getFullYear()} — Restricted
          </p>
        </div>
      </div>
    </div>
  );
}
