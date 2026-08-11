const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function assetUrl(value: string | null | undefined) {
  const path = (value || "").trim();
  if (!path || /^(?:https?:|data:|blob:)/i.test(path)) return path;
  if (path.startsWith("/Images/") || path.startsWith("/uploads/")) {
    return apiUrl(path);
  }
  return path;
}
