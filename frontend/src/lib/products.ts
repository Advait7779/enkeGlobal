export interface Product {
  id: number;
  category: string;
  manufacturer: string;
  name: string;
  description: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  image: string;
  badge: string;
  badgeColor: string;
  price?: number;
  oldPrice?: number;
}

type ProductRecord = Record<string, unknown>;

function asNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function normalizeProduct(value: unknown): Product {
  const product = (value && typeof value === 'object' ? value : {}) as ProductRecord;
  const price = product.price !== undefined ? asNumber(product.price) : undefined;
  const oldPrice = asNumber(product.old_price ?? product.oldPrice, 0);

  return {
    id: asNumber(product.id),
    category: asString(product.category),
    manufacturer: asString(product.manufacturer),
    name: asString(product.name),
    description: asString(product.description),
    inStock: Boolean(product.in_stock ?? product.inStock ?? true),
    rating: asNumber(product.rating, 4.5),
    reviews: asNumber(product.reviews),
    image: asString(product.image),
    badge: asString(product.badge),
    badgeColor: asString(product.badge_color ?? product.badgeColor),
    ...(price !== undefined && { price }),
    ...(oldPrice > 0 && { oldPrice }),
  };
}
