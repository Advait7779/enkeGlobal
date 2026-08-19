import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, LogOut, Search, Edit2, Trash2,
  Plus, ChevronLeft, ChevronRight, X, Upload, CheckCircle,
  AlertCircle, Mail, Clock,
  RefreshCw, Save, Filter, Users, Phone, ChevronDown,
  TrendingUp, Activity, Calendar, Menu,
  ChevronsLeft, ChevronsRight, Download, FileSpreadsheet, FileUp
} from "lucide-react";
import { apiUrl, assetUrl } from "../../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  category: string;
  manufacturer: string;
  name: string;
  description: string;
  in_stock: boolean;
  rating: number;
  reviews: number;
  image: string;
  badge: string;
  badge_color: string;
  price?: number;
  old_price?: number;
}

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  product_id: number | null;
  product_name: string | null;
  product_image: string | null;
  quantity: number;
  status: string;
  created_at: string;
}

interface ExcelImportResult {
  imported: number;
  category: string;
  categoriesDetected?: string[];
  isMultiCategory?: boolean;
  worksheet: string;
  warnings: string[];
}


type TabType = "dashboard" | "products" | "leads";

// ─── Live clock ──────────────────────────────────────────────────────────────
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("enke_admin_token") || "";
}
function authHeader() {
  return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

const DEFAULT_CATEGORIES = ["Electronic", "Electrical", "Mechanical"];
const MAX_EXCEL_UPLOAD_BYTES = 1024 * 1024 * 1024;
const BADGE_COLORS = [
  { label: "Red (Sale)", value: "bg-red-500" },
  { label: "Blue (New)", value: "bg-blue-500" },
  { label: "Green (Featured)", value: "bg-emerald-700" },
  { label: "Amber (Best Seller)", value: "bg-amber-500" },
  { label: "None", value: "" },
];
const EMPTY_PRODUCT: Omit<Product, "id"> = {
  category: "Electronic", manufacturer: "", name: "", description: "",
  in_stock: true, rating: 4.5, reviews: 0, image: "",
  badge: "", badge_color: "bg-blue-500",
};

const STATUS_OPTIONS = ["New", "Contacted", "Converted", "Closed"];
const STATUS_STYLES: Record<string, string> = {
  New:       "bg-blue-50 text-blue-700 border border-blue-200",
  Contacted: "bg-amber-50 text-amber-700 border border-amber-200",
  Converted: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Closed:    "bg-gray-100 text-gray-500 border border-gray-200",
};

// ─── Avatar helper ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-500","bg-purple-500","bg-emerald-500","bg-amber-500",
  "bg-rose-500","bg-indigo-500","bg-teal-500","bg-orange-500",
];
function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ─── Chart colour palette ─────────────────────────────────────────────────────
const CHART_COLORS = [
  { bg: "#3b82f6", light: "#eff6ff", text: "#1d4ed8" },   // blue
  { bg: "#10b981", light: "#ecfdf5", text: "#065f46" },   // emerald
  { bg: "#f59e0b", light: "#fffbeb", text: "#92400e" },   // amber
  { bg: "#8b5cf6", light: "#f5f3ff", text: "#5b21b6" },   // violet
  { bg: "#ef4444", light: "#fef2f2", text: "#991b1b" },   // red
  { bg: "#06b6d4", light: "#ecfeff", text: "#164e63" },   // cyan
];

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ data, total }: { data: { category: string; count: string }[]; total: number }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 75;
  const innerRadius = 48;
  const [hovered, setHovered] = useState<number | null>(null);

  // Build arc segments
  let cumAngle = -Math.PI / 2;
  const segments = data.map((item, i) => {
    const pct = parseInt(item.count) / total;
    const angle = pct * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const ix1 = cx + innerRadius * Math.cos(startAngle);
    const iy1 = cy + innerRadius * Math.sin(startAngle);
    const ix2 = cx + innerRadius * Math.cos(endAngle);
    const iy2 = cy + innerRadius * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      "Z",
    ].join(" ");

    return { d, color: CHART_COLORS[i % CHART_COLORS.length], pct, ...item };
  });

  return (
    <div className="flex items-center gap-8 flex-wrap">
      {/* SVG Donut */}
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.d}
              fill={seg.color.bg}
              opacity={hovered === null || hovered === i ? 1 : 0.4}
              style={{ transition: "opacity 0.2s, transform 0.2s", transformOrigin: `${cx}px ${cy}px`, transform: hovered === i ? "scale(1.05)" : "scale(1)", cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Centre text */}
          <text x={cx} y={cy - 8} textAnchor="middle" className="fill-gray-900" style={{ fontSize: 28, fontWeight: 800, fontFamily: "inherit" }}>{total}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 11, fontFamily: "inherit" }}>Total Products</text>
        </svg>
      </div>
      {/* Legend */}
      <div className="flex-1 space-y-3 min-w-[180px]">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-center gap-3 cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ opacity: hovered === null || hovered === i ? 1 : 0.4, transition: "opacity 0.2s" }}
          >
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.color.bg }} />
            <span className="text-sm text-gray-700 font-medium flex-1">{seg.category || "Uncategorised"}</span>
            <span className="text-sm font-bold" style={{ color: seg.color.bg }}>{seg.count}</span>
            <span className="text-xs text-gray-400">{Math.round(seg.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Animated Horizontal Bar Chart ───────────────────────────────────────────
function AnimatedBarChart({ data, total }: { data: { category: string; count: string }[]; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const maxCount = Math.max(...data.map((d) => parseInt(d.count)));

  return (
    <div className="space-y-5" ref={ref}>
      {data.map((item, i) => {
        const pct = (parseInt(item.count) / maxCount) * 100;
        const col = CHART_COLORS[i % CHART_COLORS.length];
        return (
          <div key={item.category}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.bg }} />
                <span className="text-sm font-semibold text-gray-800">{item.category || "Uncategorised"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black" style={{ color: col.bg }}>{item.count}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: col.light, color: col.text }}
                >
                  {total ? Math.round((parseInt(item.count) / total) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all ease-out"
                style={{
                  width: animated ? `${pct}%` : "0%",
                  background: `linear-gradient(90deg, ${col.bg}cc, ${col.bg})`,
                  transitionDuration: `${600 + i * 120}ms`,
                  boxShadow: `0 1px 6px ${col.bg}55`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Product Edit Modal ────────────────────────────────────────────────────────
function ProductEditModal({
  product, onClose, onSave, categories, onAddCategory,
}: {
  product: Partial<Product> | null;
  onClose: () => void;
  onSave: (data: Omit<Product, "id">, id?: number) => Promise<void>;
  categories: string[];
  onAddCategory: (category: string) => void;
}) {
  const isNew = !product?.id;
  const [form, setForm] = useState<Omit<Product, "id">>(
    product ? { ...EMPTY_PRODUCT, ...product } : { ...EMPTY_PRODUCT }
  );
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(product?.image || "");
  const [error, setError] = useState("");

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [badgeColorOpen, setBadgeColorOpen] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((prev) => ({ ...prev, image: data.url }));
      setImagePreview(data.url);
    } catch (err: unknown) {
      setError(`Upload failed: ${errorMessage(err)}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Product name is required"); return; }
    setSaving(true); setError("");
    try { await onSave(form, product?.id); }
    catch (err: unknown) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {isNew ? "Add New Product" : `Edit Product #${product?.id}`}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={20} /></button>
        </div>
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} />{error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
                {imagePreview
                  ? <img src={assetUrl(imagePreview)} alt="preview" className="w-full h-full object-contain p-1" />
                  : <Package size={28} className="text-gray-400" />}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium px-4 py-2 rounded-lg transition text-sm">
                  <Upload size={16} />
                  {uploadingImage ? "Uploading..." : "Choose Image from System"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                </label>
                <p className="text-xs text-gray-500 mt-2">Supported: JPG, PNG, WebP, GIF (max 10 MB)</p>
                {form.image && <p className="text-xs text-green-600 mt-1 font-medium truncate">✅ {form.image}</p>}
              </div>
            </div>
          </div>
          {/* Name + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. X20-BC-0083" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <div className="relative mb-2">
                <button
                  type="button"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white text-left text-gray-900 transition hover:bg-gray-50 font-medium"
                >
                  {form.category || "Select Category"}
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {categoryOpen && (
                  <div className="absolute left-0 top-full mt-1.5 z-20 bg-white rounded-lg shadow-xl border border-gray-300 py-1 w-full overflow-hidden">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, category: c }));
                          setCategoryOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition ${form.category === c ? "text-emerald-700 bg-emerald-50/50" : "text-gray-700"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!showNewCategoryInput ? (
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                >
                  <Plus size={14} /> Create New Category
                </button>
              ) : (
                <div className="flex gap-2 items-center mt-2 animate-fade-in">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name..."
                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newCategoryName.trim();
                      if (trimmed) {
                        onAddCategory(trimmed);
                        setForm((prev) => ({ ...prev, category: trimmed }));
                        setNewCategoryName("");
                        setShowNewCategoryInput(false);
                      }
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCategoryName("");
                      setShowNewCategoryInput(false);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-xs font-semibold px-1 py-1"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Manufacturer</label>
            <input name="manufacturer" value={form.manufacturer} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. B&R, MOXA, Siemens" />
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Product description..." />
          </div>
          {/* Badge + Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Badge Text</label>
              <input name="badge" value={form.badge} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Sale, New, Featured" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Badge Color</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBadgeColorOpen(!badgeColorOpen)}
                  className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white text-left text-gray-900 transition hover:bg-gray-50 font-medium"
                >
                  {BADGE_COLORS.find((bc) => bc.value === form.badge_color)?.label || "None"}
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {badgeColorOpen && (
                  <div className="absolute left-0 top-full mt-1.5 z-20 bg-white rounded-lg shadow-xl border border-gray-300 py-1 w-full overflow-hidden">
                    {BADGE_COLORS.map((bc) => (
                      <button
                        key={bc.value}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, badge_color: bc.value }));
                          setBadgeColorOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition ${form.badge_color === bc.value ? "text-emerald-700 bg-emerald-50/50" : "text-gray-700"}`}
                      >
                        {bc.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Rating + Reviews + Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rating (0–5)</label>
              <input type="number" name="rating" min="0" max="5" step="0.1" value={form.rating} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reviews Count</label>
              <input type="number" name="reviews" min="0" value={form.reviews} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="in_stock" checked={form.in_stock} onChange={handleChange}
                  className="w-4 h-4 accent-emerald-700" />
                <span className="text-sm font-semibold text-gray-700">In Stock</span>
              </label>
            </div>
          </div>
          {/* Submit */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm hover-bg-blue transition flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>Saving...</>
              ) : (
                <><Save size={16} />{isNew ? "Add Product" : "Save Changes"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExcelImportModal({
  categories, onClose, onImported,
}: {
  categories: string[];
  onClose: () => void;
  onImported: (result: ExcelImportResult) => void;
}) {
  const AUTO_DETECT = "__auto__";
  const NEW_CATEGORY = "__new_category__";
  const [categoryChoice, setCategoryChoice] = useState(AUTO_DETECT);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<string[]>([]);
  const [result, setResult] = useState<ExcelImportResult | null>(null);
  const [cleanReplace, setCleanReplace] = useState(true);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categoryChoice === NEW_CATEGORY
    ? newCategory.trim()
    : categoryChoice === AUTO_DETECT
      ? "__auto__"
      : categoryChoice;

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryMenuOpen]);

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) { setError("Please choose an .xlsx file"); return; }
    if (!selectedCategory) { setError("Please select or enter a category"); return; }

    setImporting(true);
    setError("");
    setDetails([]);

    const body = new FormData();
    body.append("file", file);
    body.append("category", selectedCategory);
    body.append("cleanReplace", String(cleanReplace));

    try {
      const response = await fetch(apiUrl("/api/products/import"), {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Excel import failed");
        setDetails(Array.isArray(data.details) ? data.details : []);
        return;
      }

      const importResult: ExcelImportResult = {
        imported: data.imported || 0,
        category: data.category || selectedCategory,
        categoriesDetected: data.categoriesDetected || [],
        isMultiCategory: Boolean(data.isMultiCategory),
        worksheet: data.worksheet || "",
        warnings: Array.isArray(data.warnings) ? data.warnings : [],
      };
      setResult(importResult);
      onImported(importResult);
    } catch (importError: unknown) {
      setError(`Cannot import workbook: ${errorMessage(importError)}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Import Products from Excel</h2>
              <p className="text-xs text-gray-500">Supports multi-tab workbooks, categories & embedded pictures</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={importing}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-40" aria-label="Close import form">
            <X size={20} />
          </button>
        </div>

        {result ? (
          <div className="p-8">
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle size={34} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Import completed successfully!</h3>
              <p className="text-gray-600 mt-2">
                <strong>{result.imported}</strong> products were added
                {result.worksheet ? ` across sheets: ${result.worksheet}` : ""}.
              </p>

              {result.categoriesDetected && result.categoriesDetected.length > 0 && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                    Categories Added / Updated ({result.categoriesDetected.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.categoriesDetected.map((cat) => (
                      <span key={cat} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 border border-emerald-300 shadow-sm">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {result.warnings.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-bold text-amber-800 mb-2">Imported with warnings ({result.warnings.length})</p>
                <ul className="space-y-1 text-xs text-amber-700 list-disc pl-5 max-h-36 overflow-y-auto">
                  {result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
                </ul>
              </div>
            )}
            <button type="button" onClick={onClose}
              className="w-full mt-6 bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-emerald-700/20">
              Done & View Products
            </button>
          </div>
        ) : (
          <form onSubmit={handleImport} className="p-6 space-y-6">
            {(error || details.length > 0) && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                <div className="flex items-start gap-2 text-sm font-semibold"><AlertCircle size={17} className="mt-0.5 flex-shrink-0" />{error}</div>
                {details.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs list-disc pl-7 max-h-32 overflow-y-auto">
                    {details.map((detail, index) => <li key={index}>{detail}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">1. Choose Category Mode *</label>
              <div className="relative" ref={categoryMenuRef}>
                <button type="button" onClick={() => setCategoryMenuOpen((open) => !open)}
                  aria-expanded={categoryMenuOpen}
                  className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl bg-white text-sm font-semibold text-gray-800 transition focus:outline-none ${categoryMenuOpen ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-gray-300 hover:border-emerald-400"}`}>
                  <span>
                    {categoryChoice === AUTO_DETECT
                      ? "⚡ Auto-detect categories from Excel sheets (Recommended)"
                      : categoryChoice === NEW_CATEGORY
                        ? "Add a new category"
                        : `Assign all to: ${categoryChoice}`}
                  </span>
                  <ChevronDown size={17} className={`text-gray-400 transition-transform ${categoryMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {categoryMenuOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 overflow-hidden animate-scale-up max-h-64 overflow-y-auto">
                    <button type="button"
                      onClick={() => { setCategoryChoice(AUTO_DETECT); setCategoryMenuOpen(false); }}
                      className={`w-full flex items-center justify-between text-left px-4 py-2.5 text-sm font-bold transition ${categoryChoice === AUTO_DETECT ? "bg-emerald-50 text-emerald-700" : "text-emerald-700 hover:bg-emerald-50/50"}`}>
                      <span>⚡ Auto-detect categories from Excel sheets</span>
                      {categoryChoice === AUTO_DETECT && <CheckCircle size={15} />}
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <p className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Or assign all to single category</p>
                    {categories.map((category) => (
                      <button key={category} type="button"
                        onClick={() => { setCategoryChoice(category); setCategoryMenuOpen(false); }}
                        className={`w-full flex items-center justify-between text-left px-4 py-2 text-sm font-medium transition ${categoryChoice === category ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                        {category}
                        {categoryChoice === category && <CheckCircle size={15} />}
                      </button>
                    ))}
                    <div className="h-px bg-gray-100 my-1" />
                    <button type="button"
                      onClick={() => { setCategoryChoice(NEW_CATEGORY); setCategoryMenuOpen(false); }}
                      className={`w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm font-bold transition ${categoryChoice === NEW_CATEGORY ? "bg-emerald-50 text-emerald-700" : "text-emerald-700 hover:bg-emerald-50"}`}>
                      <Plus size={16} />Add a new custom category
                    </button>
                  </div>
                )}
              </div>
              {categoryChoice === NEW_CATEGORY && (
                <input type="text" value={newCategory} onChange={(event) => setNewCategory(event.target.value)}
                  maxLength={100} autoFocus placeholder="Enter new category name"
                  className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              )}
              <p className="text-xs text-gray-500 mt-2">
                {categoryChoice === AUTO_DETECT
                  ? "✓ Reads every sheet tab (e.g. B-PNEUM ➔ Pneumatic, C-MECH ➔ Mechanical, etc.) and auto-creates their categories."
                  : "This single category will be applied to every imported product row."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">2. Upload Excel workbook (.xlsx) *</label>
              <label className={`block rounded-2xl border-2 border-dashed p-7 text-center cursor-pointer transition ${file ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/40"}`}>
                <FileUp size={32} className={`mx-auto mb-3 ${file ? "text-emerald-700" : "text-gray-400"}`} />
                <span className="block text-sm font-bold text-gray-800">{file ? file.name : "Choose an .xlsx file"}</span>
                <span className="block text-xs text-gray-500 mt-1">Multi-sheet workbook with embedded photos supported (up to 1 GB)</span>
                <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] || null;
                    if (selectedFile && selectedFile.size > MAX_EXCEL_UPLOAD_BYTES) {
                      setFile(null);
                      setError("Excel workbook exceeds the 1 GB upload limit");
                      event.target.value = "";
                      return;
                    }
                    setError("");
                    setFile(selectedFile);
                  }} className="hidden" />
              </label>
            </div>

            <div className="flex items-start gap-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200">
              <input
                type="checkbox"
                id="cleanReplace"
                checked={cleanReplace}
                onChange={(e) => setCleanReplace(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="cleanReplace" className="text-xs text-amber-900 cursor-pointer select-none">
                <span className="font-bold">Replace existing catalog (Clean re-import)</span>
                <span className="block font-normal text-amber-700 mt-0.5">Recommended for full updates to ensure all product images and categories refresh cleanly without duplicates.</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={onClose} disabled={importing}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={importing || !file || !selectedCategory}
                className="flex-1 bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-800 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-700/20">
                {importing ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Importing Products & Photos...</>
                ) : <><FileSpreadsheet size={17} />Import Products & Categories</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Colorful SVG Icons ──────────────────────────────────────────────────────
const DashboardIcon = () => (
  <svg className="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="8" height="8" rx="2" fill="url(#db-grad-1)" />
    <rect x="13" y="3" width="8" height="8" rx="2" fill="url(#db-grad-2)" />
    <rect x="3" y="13" width="8" height="8" rx="2" fill="url(#db-grad-3)" />
    <rect x="13" y="13" width="8" height="8" rx="2" fill="url(#db-grad-4)" />
    <defs>
      <linearGradient id="db-grad-1" x1="3" y1="3" x2="11" y2="11" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="db-grad-2" x1="13" y1="3" x2="21" y2="11" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="db-grad-3" x1="3" y1="13" x2="11" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="db-grad-4" x1="13" y1="13" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EC4899" />
        <stop offset="1" stopColor="#BE185D" />
      </linearGradient>
    </defs>
  </svg>
);

const LeadsIcon = () => (
  <svg className="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4" fill="url(#leads-grad-1)" />
    <path d="M6 19C6 15.6863 9.31371 13 12 13C14.6863 13 18 15.6863 18 19V21H6V19Z" fill="url(#leads-grad-2)" />
    <defs>
      <linearGradient id="leads-grad-1" x1="8" y1="3" x2="16" y2="11" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A78BFA" />
        <stop offset="1" stopColor="#6D28D9" />
      </linearGradient>
      <linearGradient id="leads-grad-2" x1="6" y1="13" x2="18" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED" />
        <stop offset="1" stopColor="#4C1D95" />
      </linearGradient>
    </defs>
  </svg>
);

const ProductsIcon = () => (
  <svg className="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.69l8.5 4.9v8.82l-8.5 4.9-8.5-4.9V7.59l8.5-4.9z" fill="url(#prod-grad-bg)" opacity="0.15" />
    <path d="M12 3L3.5 7.9L12 12.8L20.5 7.9L12 3Z" fill="url(#prod-grad-top)" />
    <path d="M3.5 9V19L12 23.8V13.8L3.5 9Z" fill="url(#prod-grad-left)" />
    <path d="M20.5 9V19L12 23.8V13.8L20.5 9Z" fill="url(#prod-grad-right)" />
    <defs>
      <linearGradient id="prod-grad-bg" x1="3.5" y1="2.69" x2="20.5" y2="21.31" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDBA74" />
        <stop offset="1" stopColor="#F97316" />
      </linearGradient>
      <linearGradient id="prod-grad-top" x1="3.5" y1="3" x2="20.5" y2="12.8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="1" stopColor="#EAB308" />
      </linearGradient>
      <linearGradient id="prod-grad-left" x1="3.5" y1="9" x2="12" y2="23.8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F97316" />
        <stop offset="1" stopColor="#C2410C" />
      </linearGradient>
      <linearGradient id="prod-grad-right" x1="12" y1="13.8" x2="20.5" y2="23.8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EA580C" />
        <stop offset="1" stopColor="#9A3412" />
      </linearGradient>
    </defs>
  </svg>
);

function StatusDropdown({ enquiryId, current, onUpdate }: {
  enquiryId: number; current: string; onUpdate: (id: number, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const btn = buttonRef.current;
      const scrollContainer = btn.closest(".overflow-x-auto") || btn.closest(".overflow-hidden") || document.body;
      const btnRect = btn.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const spaceBelow = containerRect.bottom - btnRect.bottom;
      const spaceAbove = btnRect.top - containerRect.top;
      if (spaceBelow < 150 && spaceAbove > 150) {
        setOpenUp(true);
      } else {
        setOpenUp(false);
      }
    }
    setOpen(!open);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[current] || STATUS_STYLES["New"]}`}
      >
        ● {current}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className={`absolute right-0 z-20 bg-white rounded-lg shadow-xl border border-gray-300 py-1 w-36 overflow-hidden animate-scale-up ${
          openUp 
            ? "bottom-full mb-1.5 origin-bottom" 
            : "top-full mt-1.5 origin-top"
        }`}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { onUpdate(enquiryId, s); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 transition ${s === current ? "text-emerald-600 font-bold" : "text-gray-700"}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Panel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotalPages, setProductsTotalPages] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [productsLimit, setProductsLimit] = useState(15);
  const [leadsLimit, setLeadsLimit] = useState(15);
  const [productsLimitDropdownOpen, setProductsLimitDropdownOpen] = useState(false);
  const [leadsLimitDropdownOpen, setLeadsLimitDropdownOpen] = useState(false);

  // Leads (all enquiries) state
  const [leads, setLeads] = useState<Enquiry[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Dashboard enquiries (recent 5)
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [enquiriesTotal, setEnquiriesTotal] = useState(0);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Stats
  const [stats, setStats] = useState<{ total: number; inStock: number; byCategory: { category: string; count: string }[] } | null>(null);

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const handleAddCategory = (newCat: string) => {
    setCategories((prev) => Array.from(new Set([...prev, newCat])));
  };

  useEffect(() => {
    if (products.length > 0) {
      const dbCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
      setCategories((prev) => Array.from(new Set([...prev, ...dbCategories])));
    }
  }, [products]);

  // Modal
  const [modalProduct, setModalProduct] = useState<Partial<Product> | null | undefined>(undefined);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteLeadConfirm, setDeleteLeadConfirm] = useState<number | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const now = useLiveClock();

  // ─── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) { navigate("/admin/login"); return; }
    fetch(apiUrl("/api/auth/verify"), { method: "POST", headers: authHeader() })
      .then((r) => { if (!r.ok) { localStorage.removeItem("enke_admin_token"); navigate("/admin/login"); } });
  }, [navigate]);

  useEffect(() => {
    const showLoginToast = localStorage.getItem("enke_show_login_toast");
    if (showLoginToast === "true") {
      showToast("Logged in successfully as Administrator");
      localStorage.removeItem("enke_show_login_toast");
    }
  }, []);

  // ─── Toast ───────────────────────────────────────────────────────────────────
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Fetch products ───────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        page: String(productsPage), limit: String(productsLimit),
        ...(productSearch && { search: productSearch }),
        ...(productCategory && { category: productCategory }),
      });
      const res = await fetch(apiUrl(`/api/products?${params}`), { headers: authHeader() });
      const data = await res.json();
      setProducts(data.products || []);
      setProductsTotal(data.total || 0);
      setProductsTotalPages(data.totalPages || 1);
    } catch { showToast("Failed to load products", "error"); }
    finally { setLoadingProducts(false); }
  }, [productsPage, productSearch, productCategory, productsLimit]);

  // ─── Fetch leads (paginated, searchable) ──────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const params = new URLSearchParams({
        page: String(leadsPage), limit: String(leadsLimit),
        ...(leadSearch && { search: leadSearch }),
        ...(leadStatusFilter && { status: leadStatusFilter }),
      });
      const res = await fetch(apiUrl(`/api/enquiries?${params}`), { headers: authHeader() });
      const data = await res.json();
      setLeads(data.enquiries || []);
      setLeadsTotal(data.total || 0);
      setLeadsTotalPages(data.totalPages || 1);
    } catch { showToast("Failed to load leads", "error"); }
    finally { setLoadingLeads(false); }
  }, [leadsPage, leadSearch, leadStatusFilter, leadsLimit]);

  // ─── Fetch dashboard (recent 5 + stats) ───────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const [enqRes, statsRes] = await Promise.all([
        fetch(apiUrl("/api/enquiries?limit=5"), { headers: authHeader() }),
        fetch(apiUrl("/api/products/stats/summary"), { headers: authHeader() }),
      ]);
      const enqData = await enqRes.json();
      setRecentEnquiries(enqData.enquiries || []);
      setEnquiriesTotal(enqData.total || 0);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        const statsCategories = (statsData.byCategory || [])
          .map((item: { category: string }) => item.category)
          .filter(Boolean);
        setCategories((previous) => Array.from(new Set([...previous, ...statsCategories])));
      }
    } catch { showToast("Failed to load dashboard data", "error"); }
    finally { setLoadingDashboard(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { if (activeTab === "dashboard") fetchDashboard(); }, [activeTab, fetchDashboard]);
  useEffect(() => { if (activeTab === "leads") fetchLeads(); }, [activeTab, fetchLeads]);

  // ─── Save product ─────────────────────────────────────────────────────────────
  const handleSaveProduct = async (data: Omit<Product, "id">, id?: number) => {
    const res = await fetch(apiUrl(id ? `/api/products/${id}` : "/api/products"), {
      method: id ? "PUT" : "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to save"); }
    showToast(id ? "Product updated!" : "Product added!");
    setModalProduct(undefined);
    fetchProducts();
  };

  const handleProductsImported = (result: ExcelImportResult) => {
    if (Array.isArray(result.categoriesDetected) && result.categoriesDetected.length > 0) {
      result.categoriesDetected.forEach(handleAddCategory);
    } else if (result.category && result.category !== "__auto__") {
      handleAddCategory(result.category);
    }
    setProductsPage(1);
    const catLabel = result.categoriesDetected && result.categoriesDetected.length > 0
      ? `${result.categoriesDetected.length} categories`
      : result.category;
    showToast(`${result.imported} products imported across ${catLabel}`);
    fetchProducts();
    fetchDashboard();
  };

  // ─── Delete product ────────────────────────────────────────────────────────────
  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(apiUrl(`/api/products/${id}`), { method: "DELETE", headers: authHeader() });
      if (!res.ok) throw new Error();
      showToast("Product deleted");
      setDeleteConfirm(null);
      fetchProducts();
    } catch { showToast("Failed to delete product", "error"); }
  };

  // ─── Delete lead ───────────────────────────────────────────────────────────────
  const handleDeleteLead = async (id: number) => {
    try {
      const res = await fetch(apiUrl(`/api/enquiries/${id}`), { method: "DELETE", headers: authHeader() });
      if (!res.ok) throw new Error();
      showToast("Lead deleted successfully");
      setDeleteLeadConfirm(null);
      fetchDashboard();
      fetchLeads();
    } catch { showToast("Failed to delete lead", "error"); }
  };

  // ─── Update lead status ────────────────────────────────────────────────────────
  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(apiUrl(`/api/enquiries/${id}/status`), {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      // Update in local state without refetch
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
      setRecentEnquiries((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
      showToast(`Status updated to ${status}`);
    } catch { showToast("Failed to update status", "error"); }
  };

  // ─── Download Leads Excel/CSV ──────────────────────────────────────────────────
  const handleDownloadExcel = async () => {
    try {
      showToast("Preparing Excel export...");
      const res = await fetch(apiUrl("/api/enquiries?limit=10000"), { headers: authHeader() });
      if (!res.ok) throw new Error("Failed to fetch leads data");
      const data = await res.json() as { enquiries?: Enquiry[] };
      const allLeads: Enquiry[] = data.enquiries || [];

      if (allLeads.length === 0) {
        showToast("No leads available to download", "error");
        return;
      }

      // Format CSV content
      const headers = [
        "S.No",
        "Date",
        "Name",
        "Phone",
        "Email",
        "Subject",
        "Product Name",
        "Quantity",
        "Status"
      ];

      const csvRows = [
        headers.join(","),
        ...allLeads.map((lead, idx) => {
          const formattedDate = (() => {
            const d = new Date(lead.created_at);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `="${day}/${month}/${year}"`;
          })();

          const formattedPhone = lead.phone ? `="${lead.phone}"` : "—";

          const row = [
            idx + 1,
            formattedDate,
            lead.name,
            formattedPhone,
            lead.email || "—",
            lead.subject?.replace(/-/g, " ") || "—",
            lead.product_name || "—",
            lead.quantity || 1,
            lead.status || "New"
          ];
          // Escape quotes and commas for safe CSV formatting
          return row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
        })
      ];

      const csvContent = "\uFEFF" + csvRows.join("\n"); // Include UTF-8 BOM for Excel compatibility
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Enke_Global_Leads_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Excel download started", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to download excel sheet", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("enke_admin_token");
    localStorage.setItem("enke_show_logout_toast", "true");
    navigate("/admin/login");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-lg shadow-xl text-white text-sm font-bold transition-all transform duration-300 ${toast.type === "success" ? "bg-emerald-600 border border-emerald-500" : "bg-red-600 border border-red-500"}`}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-lg border border-gray-300 shadow-2xl p-6 w-full max-w-sm mx-4 animate-scale-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Product?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDeleteProduct(deleteConfirm)} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lead Confirm */}
      {deleteLeadConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-lg border border-gray-300 shadow-2xl p-6 w-full max-w-sm mx-4 animate-scale-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Lead?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteLeadConfirm(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDeleteLead(deleteLeadConfirm)} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGOUT CONFIRM MODAL ── */}
      {logoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-8 w-full max-w-sm mx-4 text-center animate-scale-up">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 mx-auto mb-5 flex items-center justify-center shadow-lg shadow-red-500/30">
              <LogOut size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Sign Out?</h3>
            <p className="text-slate-400 text-sm mb-7 leading-relaxed">
              You'll be logged out of the eNKe Global admin panel.<br />Your session will end immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLogoutConfirm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 rounded-lg text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 rounded-lg text-sm font-bold transition shadow-lg shadow-red-500/20"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar backdrop overlay (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 min-h-screen transform lg:transform-none lg:relative transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-[72px] min-h-[72px] px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex flex-col">
            <div className="text-white font-extrabold text-[15px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">eNKe Global Enterprises</div>
            <div className="text-slate-400 text-[10px] font-semibold tracking-widest mt-0.5">LIMITED</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white lg:hidden transition"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "dashboard" ? "bg-emerald-700 text-white font-bold" : "text-slate-300 hover:bg-slate-800"}`}
          >
            <DashboardIcon />
            Dashboard
          </button>

          {/* Leads */}
          <button
            onClick={() => { setActiveTab("leads"); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "leads" ? "bg-emerald-700 text-white font-bold" : "text-slate-300 hover:bg-slate-800"}`}
          >
            <LeadsIcon />
            Leads
            {enquiriesTotal > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "leads" ? "bg-white/20 text-white" : "bg-blue-500 text-white"}`}>
                {enquiriesTotal}
              </span>
            )}
          </button>

          {/* Products */}
          <button
            onClick={() => { setActiveTab("products"); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "products" ? "bg-emerald-700 text-white font-bold" : "text-slate-300 hover:bg-slate-800"}`}
          >
            <ProductsIcon />
            Products
            <span className="ml-auto bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
              {productsTotal}
            </span>
          </button>
        </nav>

      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto">
        {/* ── Enhanced Top bar ── */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-0 flex items-center justify-between sticky top-0 z-10 min-h-[72px]">
          {/* Left: page title & sidebar toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 lg:hidden transition"
              title="Open Menu"
            >
              <Menu size={20} />
            </button>
            <div className="py-3">
              <h1 className="text-lg font-black text-gray-900 leading-tight">
                {activeTab === "dashboard" && "Dashboard Overview"}
                {activeTab === "leads" && "Lead Management"}
                {activeTab === "products" && "Products Management"}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeTab === "dashboard" && `${stats?.total ?? 0} products · ${enquiriesTotal} enquiries · ${stats?.byCategory?.length ?? 0} categories`}
                {activeTab === "leads" && `${leadsTotal} total leads captured from the enquiry form`}
                {activeTab === "products" && `${productsTotal} products · ${stats?.inStock ?? 0} in stock · ${stats?.byCategory?.length ?? 0} categories`}
              </p>
            </div>
          </div>

          {/* Right: clock, date, actions */}
          <div className="flex items-center gap-4">
            {/* Live clock */}
            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-gray-900 font-bold text-sm tabular-nums">
                <Clock size={13} className="text-emerald-500" />
                {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                <Calendar size={10} />
                {now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-gray-200" />

            {/* Add product */}
            {activeTab === "products" && (
              <button onClick={() => setModalProduct({})}
                className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition hover:bg-emerald-800">
                <Plus size={16} />Add Product
              </button>
            )}

            {/* Refresh button */}
            <button
              onClick={() => { if (activeTab === "dashboard") fetchDashboard(); else if (activeTab === "leads") fetchLeads(); else fetchProducts(); }}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500" title="Refresh">
              <RefreshCw size={17} />
            </button>

            {/* Admin Avatar Circle */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm select-none" title="Admin">
              A
            </div>

            {/* Logout button */}
            <button
              onClick={() => setLogoutConfirm(true)}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">

          {/* ══ DASHBOARD TAB ══════════════════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-slide-up">
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2.69l8.5 4.9v8.82l-8.5 4.9-8.5-4.9V7.59l8.5-4.9z" fill="url(#prod-grad-bg)" opacity="0.15" />
                        <path d="M12 3L3.5 7.9L12 12.8L20.5 7.9L12 3Z" fill="url(#prod-grad-top)" />
                        <path d="M3.5 9V19L12 23.8V13.8L3.5 9Z" fill="url(#prod-grad-left)" />
                        <path d="M20.5 9V19L12 23.8V13.8L20.5 9Z" fill="url(#prod-grad-right)" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats?.total ?? "—"}</div>
                  <div className="text-sm text-gray-500 mt-1">Total Products</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#stock-bg-grad)" opacity="0.15" />
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="url(#stock-check-grad)" />
                        <defs>
                          <linearGradient id="stock-bg-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#34D399" />
                            <stop offset="1" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="stock-check-grad" x1="3.41" y1="5.59" x2="21" y2="19" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#10B981" />
                            <stop offset="1" stopColor="#047857" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">In Stock</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats?.inStock ?? "—"}</div>
                  <div className="text-sm text-gray-500 mt-1">In Stock Products</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="7" r="4" fill="url(#leads-grad-1)" />
                        <path d="M6 19C6 15.6863 9.31371 13 12 13C14.6863 13 18 15.6863 18 19V21H6V19Z" fill="url(#leads-grad-2)" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Leads</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{enquiriesTotal}</div>
                  <div className="text-sm text-gray-500 mt-1">Total Enquiries</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="12" width="4" height="8" rx="1" fill="url(#bar-grad-1)" />
                        <rect x="10" y="7" width="4" height="13" rx="1" fill="url(#bar-grad-2)" />
                        <rect x="17" y="3" width="4" height="17" rx="1" fill="url(#bar-grad-3)" />
                        <defs>
                          <linearGradient id="bar-grad-1" x1="3" y1="12" x2="7" y2="20" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FBBF24" />
                            <stop offset="1" stopColor="#D97706" />
                          </linearGradient>
                          <linearGradient id="bar-grad-2" x1="10" y1="7" x2="14" y2="20" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#F59E0B" />
                            <stop offset="1" stopColor="#B45309" />
                          </linearGradient>
                          <linearGradient id="bar-grad-3" x1="17" y1="3" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#EF4444" />
                            <stop offset="1" stopColor="#B91C1C" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Categories</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats?.byCategory?.length ?? "—"}</div>
                  <div className="text-sm text-gray-500 mt-1">Product Categories</div>
                </div>
              </div>

              {/* ── Advanced Category Charts ── */}
              {stats?.byCategory && stats.byCategory.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Donut Chart card */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                        <Activity size={17} className="text-blue-500" />
                        Distribution
                      </h3>
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full font-semibold">
                        Donut View
                      </span>
                    </div>
                    <DonutChart data={stats.byCategory} total={stats.total} />
                  </div>

                  {/* Animated Bar Chart card */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                        <TrendingUp size={17} className="text-emerald-600" />
                        By Category
                      </h3>
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                        Bar View
                      </span>
                    </div>
                    <AnimatedBarChart data={stats.byCategory} total={stats.total} />
                  </div>
                </div>
              )}

              {/* ── Recent Enquiries (Latest 5) ─ Card style ── */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden min-h-[300px]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Recent Enquiries</h3>
                  <span className="text-sm text-gray-400 font-medium">Latest 5</span>
                </div>

                {loadingDashboard ? (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>Loading...
                  </div>
                ) : recentEnquiries.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Mail size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No enquiries yet. They'll appear here after someone submits the contact form.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recentEnquiries.map((enq) => (
                      <div key={enq.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(enq.name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                          {enq.name.charAt(0).toUpperCase()}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">{enq.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {enq.product_name
                              ? enq.product_name
                              : enq.subject?.replace(/-/g, " ") || "General enquiry"}
                          </div>
                        </div>
                        {/* Right side: status + date */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <StatusDropdown enquiryId={enq.id} current={enq.status || "New"} onUpdate={handleUpdateStatus} />
                          <span className="text-xs text-gray-400">{formatDate(enq.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {enquiriesTotal > 5 && (
                  <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => setActiveTab("leads")}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      View all {enquiriesTotal} leads →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ LEADS TAB ══════════════════════════════════════════════════════════ */}
          {activeTab === "leads" && (
            <div className="space-y-6 animate-slide-up">
              {/* Filters & Pagination bar */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-300 flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="relative w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name, email or phone..."
                    value={leadSearch}
                    onChange={(e) => { setLeadSearch(e.target.value); setLeadsPage(1); }}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-4 ml-auto flex-wrap">
                  {/* Filter Status */}
                  <div className="flex items-center gap-2 relative">
                    <Filter size={16} className="text-gray-400" />
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="flex items-center justify-between gap-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium transition min-w-[130px]"
                    >
                      {leadStatusFilter || "All Statuses"}
                      <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    {statusDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-44 overflow-hidden">
                        <button
                          onClick={() => { setLeadStatusFilter(""); setLeadsPage(1); setStatusDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition ${!leadStatusFilter ? "text-emerald-700 bg-emerald-50/50" : "text-gray-700"}`}
                        >
                          All Statuses
                        </button>
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => { setLeadStatusFilter(s); setLeadsPage(1); setStatusDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition ${leadStatusFilter === s ? "text-emerald-700 bg-emerald-50/50" : "text-gray-700"}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Separator */}
                  <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

                  {/* Show Rows selector */}
                  <div className="flex items-center gap-2 relative">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Show:</span>
                    <button
                      onClick={() => setLeadsLimitDropdownOpen(!leadsLimitDropdownOpen)}
                      className="flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg text-xs font-bold text-gray-700 transition"
                    >
                      {leadsLimit} rows
                      <ChevronDown size={12} className="text-gray-400" />
                    </button>
                    {leadsLimitDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-28 overflow-hidden">
                        {[5, 10, 15, 20].map((val) => (
                          <button
                            key={val}
                            onClick={() => { setLeadsLimit(val); setLeadsPage(1); setLeadsLimitDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-xs font-bold transition hover:bg-gray-50 ${leadsLimit === val ? "text-emerald-700 bg-emerald-50/50" : "text-gray-600"}`}
                          >
                            {val} rows
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total Leads Count */}
                  <div className="text-sm text-gray-500 font-medium ml-2">{leadsTotal} leads</div>

                  {/* Separator */}
                  <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block" />

                  {/* Download Excel Button */}
                  <button
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 bg-emerald-700 hover:hover-bg-blue text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md shadow-emerald-500/10"
                  >
                    <Download size={16} />
                    Download Excel
                  </button>
                </div>
              </div>

              {/* Leads Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden min-h-[360px]">
                {loadingLeads ? (
                  <div className="flex items-center justify-center py-16 text-gray-400">
                    <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>Loading leads...
                  </div>
                ) : (
                  <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Sr.No</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Name</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Phone</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Email</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Subject</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Product</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Qty</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {leads.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-16 text-gray-400">
                              <Users size={40} className="mx-auto mb-3 opacity-30" />
                              <p>No leads found. When users submit the enquiry form they'll appear here.</p>
                            </td>
                          </tr>
                        ) : (
                          leads.map((lead, idx) => (
                            <tr key={lead.id} className="hover:bg-gray-50 transition">
                              {/* Sr No */}
                              <td className="px-5 py-4 text-gray-400 text-xs font-mono">
                                {(leadsPage - 1) * 15 + idx + 1}
                              </td>
                              {/* Name + Avatar */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(lead.name)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                                    {lead.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-gray-900 whitespace-nowrap">{lead.name}</span>
                                </div>
                              </td>
                              {/* Phone */}
                              <td className="px-5 py-4">
                                {lead.phone ? (
                                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-xs whitespace-nowrap">
                                    <Phone size={12} />{lead.phone}
                                  </a>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              {/* Email */}
                              <td className="px-5 py-4">
                                {lead.email ? (
                                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 text-xs whitespace-nowrap">
                                    <Mail size={12} className="text-gray-400" />
                                    <span className="max-w-[150px] truncate">{lead.email}</span>
                                  </a>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              {/* Subject */}
                              <td className="px-5 py-4">
                                <span className="text-gray-600 text-xs max-w-[140px] truncate block capitalize">
                                  {lead.subject?.replace(/-/g, " ") || "—"}
                                </span>
                              </td>
                              {/* Product */}
                              <td className="px-5 py-4">
                                {lead.product_name ? (
                                  <div className="flex items-center gap-2">
                                    {lead.product_image && (
                                      <img src={assetUrl(lead.product_image)} alt="" className="w-7 h-7 object-contain rounded border border-gray-100 bg-gray-50" />
                                    )}
                                    <span className="text-xs text-gray-700 font-medium max-w-[120px] truncate">{lead.product_name}</span>
                                  </div>
                                ) : <span className="text-gray-300 text-xs">—</span>}
                              </td>
                              {/* Quantity */}
                              <td className="px-5 py-4 text-gray-600 text-xs">{lead.quantity}</td>
                              {/* Date */}
                              <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{formatDateTime(lead.created_at)}</td>
                              {/* Status */}
                              <td className="px-5 py-4">
                                <StatusDropdown enquiryId={lead.id} current={lead.status || "New"} onUpdate={handleUpdateStatus} />
                              </td>
                              {/* Action */}
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => setDeleteLeadConfirm(lead.id)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Lead"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bottom Pagination */}
                {leadsTotal > 0 && (
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Page {leadsPage} of {leadsTotalPages || 1}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setLeadsPage(1)} disabled={leadsPage === 1}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-500" title="First Page">
                        <ChevronsLeft size={16} />
                      </button>
                      <button onClick={() => setLeadsPage((p) => Math.max(1, p - 1))} disabled={leadsPage === 1}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-500" title="Previous Page">
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: Math.min(5, leadsTotalPages || 1) }, (_, i) => {
                        const page = leadsPage <= 3 ? i + 1 : leadsPage >= leadsTotalPages - 2 ? leadsTotalPages - 4 + i : leadsPage - 2 + i;
                        if (page < 1 || page > leadsTotalPages) return null;
                        return (
                          <button key={page} onClick={() => setLeadsPage(page)}
                            className={`w-8 h-8 border rounded-lg text-sm font-medium transition ${leadsPage === page ? "bg-emerald-700 text-white border-emerald-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                            {page}
                          </button>
                        );
                      })}
                      <button onClick={() => setLeadsPage((p) => Math.min(leadsTotalPages || 1, p + 1))} disabled={leadsPage === (leadsTotalPages || 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-500" title="Next Page">
                        <ChevronRight size={16} />
                      </button>
                      <button onClick={() => setLeadsPage(leadsTotalPages || 1)} disabled={leadsPage === (leadsTotalPages || 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-500" title="Last Page">
                        <ChevronsRight size={16} />
                      </button>
                    </div>
                  </div>
                )}


              </div>


            </div>
          )}

          {/* ══ PRODUCTS TAB ══════════════════════════════════════════════════════ */}
          {activeTab === "products" && (
            <div className="space-y-6 animate-slide-up">
              {/* Filters & Pagination bar */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-300 flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="relative w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); setProductsPage(1); }}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-4 ml-auto flex-wrap">
                  <button type="button" onClick={() => setImportModalOpen(true)}
                    className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg px-3.5 py-2 text-sm font-bold transition">
                    <FileSpreadsheet size={17} />Import from Excel
                  </button>

                  <div className="w-px h-6 bg-gray-200 hidden sm:block" />

                  {/* Filter Category */}
                  <div className="flex items-center gap-2 relative">
                    <Filter size={16} className="text-gray-400" />
                    <button
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="flex items-center justify-between gap-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium transition min-w-[150px]"
                    >
                      {productCategory || "All Categories"}
                      <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    {categoryDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-44 overflow-hidden">
                        <button
                          onClick={() => { setProductCategory(""); setProductsPage(1); setCategoryDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition ${!productCategory ? "text-emerald-700 bg-emerald-50/50" : "text-gray-700"}`}
                        >
                          All Categories
                        </button>
                        {categories.map((c) => (
                          <button
                            key={c}
                            onClick={() => { setProductCategory(c); setProductsPage(1); setCategoryDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition ${productCategory === c ? "text-emerald-700 bg-emerald-50/50" : "text-gray-700"}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Separator */}
                  <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

                  {/* Show Rows selector */}
                  <div className="flex items-center gap-2 relative">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Show:</span>
                    <button
                      onClick={() => setProductsLimitDropdownOpen(!productsLimitDropdownOpen)}
                      className="flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg text-xs font-bold text-gray-700 transition"
                    >
                      {productsLimit} rows
                      <ChevronDown size={12} className="text-gray-400" />
                    </button>
                    {productsLimitDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-28 overflow-hidden">
                        {[5, 10, 15, 20].map((val) => (
                          <button
                            key={val}
                            onClick={() => { setProductsLimit(val); setProductsPage(1); setProductsLimitDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-xs font-bold transition hover:bg-gray-50 ${productsLimit === val ? "text-emerald-700 bg-emerald-50/50" : "text-gray-600"}`}
                          >
                            {val} rows
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total Products Count */}
                  <div className="text-sm text-gray-500 font-medium ml-2">{productsTotal} products</div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-16 text-gray-400">
                    <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>Loading products...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">ID</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Image</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Name</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Category</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Manufacturer</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Description</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Stock</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Badge</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {products.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-12 text-gray-400">
                              <Package size={40} className="mx-auto mb-3 opacity-30" />
                              <p>No products found</p>
                            </td>
                          </tr>
                        ) : products.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition">
                            <td className="px-5 py-3 text-gray-400 font-mono text-xs">{p.id}</td>
                            <td className="px-5 py-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                                {p.image ? (
                                  <img src={assetUrl(p.image)} alt={p.name} className="w-full h-full object-contain p-1"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                ) : <Package size={18} className="text-gray-300" />}
                              </div>
                            </td>
                            <td className="px-5 py-3 font-semibold text-gray-900 max-w-[160px]">
                              <span className="truncate block" title={p.name}>{p.name}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">{p.category}</span>
                            </td>
                            <td className="px-5 py-3 text-gray-600 text-xs">{p.manufacturer || "—"}</td>
                            <td className="px-5 py-3 text-gray-500 text-xs max-w-[200px]">
                              <span className="truncate block" title={p.description}>{p.description || "—"}</span>
                            </td>
                            <td className="px-5 py-3">
                              {p.in_stock
                                ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle size={12} />Yes</span>
                                : <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><AlertCircle size={12} />No</span>}
                            </td>
                            <td className="px-5 py-3">
                              {p.badge
                                ? <span className={`${p.badge_color} text-white text-xs px-2 py-1 rounded-full`}>{p.badge}</span>
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setModalProduct(p)}
                                  className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition" title="Edit">
                                  <Edit2 size={15} />
                                </button>
                                <button onClick={() => setDeleteConfirm(p.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition" title="Delete">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bottom Pagination */}
                {productsTotal > 0 && (
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Page {productsPage} of {productsTotalPages || 1}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setProductsPage(1)} disabled={productsPage === 1}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-500" title="First Page">
                        <ChevronsLeft size={16} />
                      </button>
                      <button onClick={() => setProductsPage((p) => Math.max(1, p - 1))} disabled={productsPage === 1}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-500" title="Previous Page">
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: Math.min(5, productsTotalPages || 1) }, (_, i) => {
                        const page = productsPage <= 3 ? i + 1 : productsPage >= productsTotalPages - 2 ? productsTotalPages - 4 + i : productsPage - 2 + i;
                        if (page < 1 || page > productsTotalPages) return null;
                        return (
                          <button key={page} onClick={() => setProductsPage(page)}
                            className={`w-8 h-8 border rounded-lg text-sm font-medium transition ${productsPage === page ? "bg-emerald-700 text-white border-emerald-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                            {page}
                          </button>
                        );
                      })}
                      <button onClick={() => setProductsPage((p) => Math.min(productsTotalPages || 1, p + 1))} disabled={productsPage === (productsTotalPages || 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-500" title="Next Page">
                        <ChevronRight size={16} />
                      </button>
                      <button onClick={() => setProductsPage(productsTotalPages || 1)} disabled={productsPage === (productsTotalPages || 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-500" title="Last Page">
                        <ChevronsRight size={16} />
                      </button>
                    </div>
                  </div>
                )}


              </div>
            </div>
          )}

        </div>
      </main>

      {/* Product Edit/Add Modal */}
      {modalProduct !== undefined && (
        <ProductEditModal
          product={modalProduct}
          onClose={() => setModalProduct(undefined)}
          onSave={handleSaveProduct}
          categories={categories}
          onAddCategory={handleAddCategory}
        />
      )}

      {importModalOpen && (
        <ExcelImportModal
          categories={categories}
          onClose={() => setImportModalOpen(false)}
          onImported={handleProductsImported}
        />
      )}
    </div>
  );
}
