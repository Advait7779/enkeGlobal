import { MapPin, Phone, Mail, Clock, Send, MessageCircle, ShoppingCart, Package, Plus, Search, Minus, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl, assetUrl } from "../lib/api";

interface ProductState {
  id: number;
  name: string;
  image: string;
  category: string;
}
interface CartProductItem {
  product: ProductState;
  quantity: number;
}

interface LocationState {
  product?: ProductState;
  quantity?: number;
}

const SUBJECT_OPTIONS = [
  { value: "need-quotation", label: "Need a quotation" },
  { value: "product-availability", label: "Product availability" },
  { value: "support-for-import", label: "Support for Import" },
  { value: "technical-support-to-choose-product", label: "Technical support to choose the right product" },
  { value: "customise-product", label: "Customise the product" },
  { value: "quotation-for-3d-printing", label: "Quotation for 3D printing" },
  { value: "quotation-for-die-making", label: "Quotation for die making" },
  { value: "quotation-for-silicon-customised-product", label: "Quotation for silicon customised product" },
  { value: "quotation-for-customised-ptfe-product", label: "Quotation for customised PTFE product" },
  { value: "quotation-for-customised-power-transmission-belt", label: "Quotation for customised power transmission belt" }
];

export default function Contact() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [enquiryProducts, setEnquiryProducts] = useState<CartProductItem[]>(
    state?.product ? [{ product: state.product, quantity: state.quantity || 1 }] : []
  );
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductState[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const openProductModal = () => {
    setProductModalOpen(true);
    if (allProducts.length === 0) {
      setLoadingProducts(true);
      fetch(apiUrl("/api/products?limit=500"))
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json() as Promise<{ products?: unknown[] }>;
        })
        .then((data) => {
          if (data.products) {
            const normalized = data.products.map((product) => {
              const record = product && typeof product === "object"
                ? product as Record<string, unknown>
                : {};
              return {
                id: Number(record.id),
                name: String(record.name || ""),
                image: String(record.image || ""),
                category: String(record.category || ""),
              };
            });
            setAllProducts(normalized);
          }
        })
        .catch((err) => console.error("Error loading products:", err))
        .finally(() => setLoadingProducts(false));
    }
  };

  const updateMessage = (productsList: CartProductItem[]) => {
    if (productsList.length === 0) return "";
    const productLines = productsList
      .map((item, idx) => `${idx + 1}. Product: ${item.product.name}\n   Quantity: ${item.quantity}`)
      .join("\n\n");
    return `I am interested in the following products:\n\n${productLines}\n\nPlease provide pricing and availability.`;
  };

  const handleSelectProduct = (product: ProductState, quantity: number) => {
    setEnquiryProducts((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      let updated;
      if (exists) {
        updated = prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [...prev, { product, quantity }];
      }

      setFormData((formPrev) => ({
        ...formPrev,
        subject: formPrev.subject || "need-quotation",
        message: updateMessage(updated),
      }));

      return updated;
    });
    setProductModalOpen(false);
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: state?.product ? "need-quotation" : "",
    message: state?.product
      ? `I am interested in the following products:\n\n1. Product: ${state.product.name}\n   Quantity: ${state.quantity || 1}\n\nPlease provide pricing and availability.`
      : "",
  });

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const primaryItem = enquiryProducts[0];
      const subjectLabel = SUBJECT_OPTIONS.find((option) => option.value === formData.subject)?.label
        || formData.subject.trim();
      const res = await fetch(apiUrl("/api/enquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          product_id: primaryItem?.product.id || null,
          product_name: primaryItem?.product.name || null,
          product_image: primaryItem?.product.image || null,
          quantity: primaryItem?.quantity || 1,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit enquiry");
      }

      const resData = await res.json() as { web3forms_key?: string | null };
      if (resData.web3forms_key) {
        void fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          keepalive: true,
          body: JSON.stringify({
            access_key: resData.web3forms_key,
            from_name: formData.name,
            replyto: formData.email,
            subject: `New ENKEglobal Enquiry: ${subjectLabel}`,
            "User Name": formData.name,
            "User Email": formData.email,
            "User Phone": formData.phone || "N/A",
            "Subject": subjectLabel,
            "Message": formData.message,
            "Product Enquired": primaryItem?.product.name || "N/A",
            "Quantity": primaryItem?.quantity || 1
          })
        }).then((web3res) => {
          if (!web3res.ok) {
            console.error("Web3Forms client-side submission error:", web3res.status);
          }
        }).catch((web3Err) => {
          console.error("Web3Forms client-side submission failed:", web3Err);
        });
      }

      const whatsappLines = [
        "Hello ENKE Global,",
        "",
        "*NEW WEBSITE ENQUIRY*",
        "------------------------------",
        `*Name:* ${formData.name.trim()}`,
        `*Email:* ${formData.email.trim()}`,
        `*Phone:* ${formData.phone.trim() || "Not provided"}`,
        `*Subject:* ${subjectLabel}`,
        "",
        "*Message:*",
        formData.message.trim(),
      ];

      if (primaryItem) {
        whatsappLines.push(
          "",
          "*Product Details:*",
          `*Product:* ${primaryItem.product.name}`,
          `*Quantity:* ${primaryItem.quantity || 1}`,
        );
      }

      whatsappLines.push("", "Please contact me regarding this enquiry.");
      const whatsappText = whatsappLines.join("\n");

      const whatsappUrl = `https://wa.me/2347063633299?text=${encodeURIComponent(whatsappText)}`;
      window.location.href = whatsappUrl;

      setSentEmail(formData.email);
      setSent(true);
      setEnquiryProducts([]);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error: unknown) {
      console.error("Enquiry submission failed:", error);
      const message = error instanceof Error ? error.message : "Please check your network connection and try again.";
      alert(`Failed to submit enquiry. Error: ${message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-emerald-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-emerald-100">
            Engineering Spares, Components or Critical Parts we deliver it all.
          </p>
          <p className="text-xl text-emerald-100">
            We're here to help and answer any question you might have
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Product Enquiry Card */}
        {enquiryProducts.length > 0 && (
          <div className="mb-10 bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={20} className="text-emerald-700" />
              <h2 className="text-lg font-bold text-gray-800">Your Product Enquiry</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enquiryProducts.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4 bg-white p-4 rounded-lg border border-blue-100 shadow-sm relative group">
                  <div className="w-20 h-20 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
                    <img
                      src={assetUrl(item.product.image)}
                      alt={item.product.name}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/favicon.ico";
                      }}
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <span className="inline-block bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1">
                      {item.product.category}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 truncate" title={item.product.name}>
                      {item.product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Package size={14} className="text-gray-500" />
                      <span className="text-xs text-gray-600 font-medium">
                        Quantity: <span className="text-emerald-700 font-bold">{item.quantity}</span>
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setEnquiryProducts((prev) => {
                        const updated = prev.filter((it) => it.product.id !== item.product.id);
                        setFormData((formPrev) => ({
                          ...formPrev,
                          message: updateMessage(updated),
                          subject: updated.length === 0 ? "" : formPrev.subject,
                        }));
                        if (updated.length === 0) {
                          navigate("/contact", { replace: true, state: null });
                        }
                        return updated;
                      });
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition duration-200"
                    title="Remove product"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-blue-100">
              <button
                type="button"
                onClick={openProductModal}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} /> Add Another Product
              </button>
              <button
                type="button"
                onClick={() => {
                  setEnquiryProducts([]);
                  setFormData((prev) => ({
                    ...prev,
                    message: "",
                    subject: "",
                  }));
                  navigate("/contact", { replace: true, state: null });
                }}
                className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Get In Touch
            </h2>

            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white">
                    <MapPin size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Address</h3>
                  <p className="text-gray-600 mt-1">
                    8, Marks Street, Singer Sango Ogun State,
                    <br />
                    Ijako Sugar Sango, Oygun State,
                    <br />
                    Nigeria
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white">
                    <Phone size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Phone</h3>
                  <p className="text-gray-600 mt-1">
                    <a href="tel:+234-8147526350" className="hover-blue">
                      +234-814-752-6350
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white">
                    <MessageCircle size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    What's App
                  </h3>
                  <p className="text-gray-600 mt-1">
                    <a
                      href="https://wa.me/2347063633299"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover-blue"
                    >
                      +234-706-363-3299
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white">
                    <Mail size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Email</h3>
                  <p className="text-gray-600 mt-1">
                    <a
                      href="mailto:enkenterprises2024@gmail.com"
                      className="hover-blue"
                    >
                      enkenterprises2024@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white">
                    <Clock size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Business Hours
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Monday - Saturday: 7:00 AM - 9:00 PM
                    <br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Why Contact Us?
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold mt-1">•</span>
                  <span>Product inquiries and specifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold mt-1">•</span>
                  <span>Bulk order pricing and quotes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold mt-1">•</span>
                  <span>Technical support and after-sales service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold mt-1">•</span>
                  <span>Delivery and logistics inquiries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold mt-1">•</span>
                  <span>Partnership and collaboration opportunities</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {enquiryProducts.length > 0 ? "Send Enquiry for Products" : "Send us a Message"}
            </h2>

            {sent ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={36} className="text-emerald-700" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enquiry Sent!</h3>
                <p className="text-gray-600 mb-6">
                  Our team will get back to you soon at <strong>{sentEmail || "your email"}</strong>.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium hover-bg-blue transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-700"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-700"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-700"
                      placeholder="+234-xxx-xxx-xxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:border-blue-700 text-left text-sm text-gray-700 font-medium transition"
                    >
                      {SUBJECT_OPTIONS.find((o) => o.value === formData.subject)?.label || "Select a subject"}
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {subjectDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 z-30 bg-white rounded-xl shadow-xl border border-gray-200 max-h-60 overflow-y-auto py-1">
                        <button
                          type="button"
                          onClick={() => { setFormData((prev) => ({ ...prev, subject: "" })); setSubjectDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${!formData.subject ? "text-emerald-700 bg-emerald-50/50 font-semibold" : "text-gray-700"}`}
                        >
                          Select a subject
                        </button>
                        {SUBJECT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setFormData((prev) => ({ ...prev, subject: opt.value })); setSubjectDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${formData.subject === opt.value ? "text-emerald-700 bg-emerald-50/50 font-semibold" : "text-gray-700"}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-700"
                    placeholder="Please describe your inquiry in detail..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-emerald-700 text-white py-4 rounded-lg font-medium text-lg hover-bg-blue transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      {enquiryProducts.length > 0 ? "Send Product Enquiry" : "Send Message"}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  We'll get back to you as soon as possible. Thank you for your
                  interest!
                </p>
              </form>
            )}
          </div>
        </div>

        <div className="bg-emerald-50 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Our Location
          </h2>
          <div className="bg-gray-200 rounded-lg overflow-hidden h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.9482825499543!2d3.4218621!3d6.4316999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b8b8b8b8b8b%3A0x8b8b8b8b8b8b8b8b!2sVictoria%20Island%2C%20Lagos!5e0!3m2!1sen!2sng!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Product Selector Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-gray-100 animate-scale-up">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="text-emerald-700" size={24} />
                Select Product to Enquire
              </h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter controls */}
            <div className="p-6 bg-gray-50 border-b border-gray-200 flex gap-4 items-center flex-wrap sm:flex-nowrap">
              <div className="flex-grow relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Filter:</span>
                <button
                  type="button"
                  onClick={() => setSelectedCat("")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    !selectedCat
                      ? "bg-emerald-700 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  All
                </button>
                {["Electronic", "Electrical", "Mechanical"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCat(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      selectedCat === cat
                        ? "bg-emerald-700 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                  <svg className="animate-spin h-8 w-8 text-emerald-700 mb-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Loading products...</span>
                </div>
              ) : (
                <>
                  {allProducts.filter((p) => {
                    const matchesSearch =
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.category.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesCat = !selectedCat || p.category === selectedCat;
                    return matchesSearch && matchesCat;
                  }).length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                      <Package className="mx-auto mb-3 opacity-30 animate-pulse" size={48} />
                      <p className="text-lg font-medium">No products found</p>
                      <p className="text-xs mt-1">Try resetting your filters or search terms.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allProducts
                        .filter((p) => {
                          const matchesSearch =
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesCat = !selectedCat || p.category === selectedCat;
                          return matchesSearch && matchesCat;
                        })
                        .map((p) => {
                          const qty = quantities[p.id] || 1;
                          return (
                            <div
                              key={p.id}
                              className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-center hover:shadow-md transition duration-300 group"
                            >
                              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1 group-hover:border-emerald-200 transition">
                                <img
                                  src={assetUrl(p.image)}
                                  alt={p.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/favicon.ico";
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1">
                                  {p.category}
                                </span>
                                <h4 className="text-sm font-bold text-gray-900 truncate" title={p.name}>
                                  {p.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setQuantities((prev) => ({
                                        ...prev,
                                        [p.id]: Math.max(1, qty - 1),
                                      }))
                                    }
                                    className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-100 transition text-gray-500 text-sm font-bold"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="text-xs font-bold text-gray-800 w-6 text-center">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setQuantities((prev) => ({
                                        ...prev,
                                        [p.id]: qty + 1,
                                      }))
                                    }
                                    className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-100 transition text-gray-500 text-sm font-bold"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectProduct(p, qty)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                              >
                                Select
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
