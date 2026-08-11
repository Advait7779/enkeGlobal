const path = require('path');
const ExcelJS = require('exceljs');

const MAX_PRODUCTS = 10000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 900 * 1024 * 1024;

const HEADER_ALIASES = {
  name: ['name', 'productname', 'product', 'producttitle', 'title', 'partnumber', 'partno', 'sku', 'model'],
  manufacturer: ['manufacturer', 'brand', 'make', 'company'],
  description: ['description', 'productdescription', 'details', 'specification', 'specifications'],
  in_stock: ['instock', 'stock', 'availability', 'available'],
  rating: ['rating', 'stars'],
  reviews: ['reviews', 'reviewcount', 'numberofreviews'],
  image: ['image', 'imageurl', 'imagepath', 'photo', 'picture'],
  badge: ['badge', 'label'],
  badge_color: ['badgecolor', 'badgestyle', 'badgecolour'],
  price: ['price', 'currentprice', 'sellingprice'],
  old_price: ['oldprice', 'originalprice', 'previousprice', 'listprice'],
};

const ALIAS_LOOKUP = new Map(
  Object.entries(HEADER_ALIASES).flatMap(([field, aliases]) => aliases.map((alias) => [alias, field]))
);

const BADGE_COLORS = new Set(['', 'bg-red-500', 'bg-blue-500', 'bg-emerald-700', 'bg-amber-500']);
const IMAGE_EXTENSIONS = new Set(['jpeg', 'jpg', 'png', 'gif', 'webp']);

function normalizeHeader(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function cellText(cell) {
  if (!cell) return '';
  if (typeof cell.text === 'string') return cell.text.trim();
  const value = cell.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || '').join('').trim();
    if (value.result !== undefined && value.result !== null) return String(value.result).trim();
    if (value.text !== undefined && value.text !== null) return String(value.text).trim();
  }
  return String(value).trim();
}

function findHeaderRow(worksheet) {
  const maxRow = Math.min(worksheet.actualRowCount || worksheet.rowCount || 0, 20);
  for (let rowNumber = 1; rowNumber <= maxRow; rowNumber += 1) {
    const columns = {};
    worksheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const field = ALIAS_LOOKUP.get(normalizeHeader(cellText(cell)));
      if (field && !columns[field]) columns[field] = columnNumber;
    });
    if (columns.name) return { rowNumber, columns };
  }
  return null;
}

function parseNumber(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {}) {
  const parsed = Number.parseFloat(String(value || '').replace(/,/g, ''));
  if (!Number.isFinite(parsed)) return fallback;
  const bounded = Math.min(Math.max(parsed, min), max);
  return integer ? Math.round(bounded) : bounded;
}

function parseStock(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return true;
  return !['false', 'no', 'n', '0', 'out of stock', 'outofstock', 'unavailable'].includes(normalized);
}

function normalizeImageReference(value, warnings, rowNumber) {
  const reference = String(value || '').trim();
  if (!reference) return '';
  if (
    /^https?:\/\//i.test(reference)
    || reference.startsWith('/Images/')
    || reference.startsWith('/uploads/')
  ) return reference;

  const filename = reference.split(/[\\/]/).pop() || '';
  const extension = path.extname(filename).slice(1).toLowerCase();
  if (filename && IMAGE_EXTENSIONS.has(extension)) return `/Images/${filename}`;

  warnings.push(`Row ${rowNumber}: image reference was ignored; embed the image or use an HTTP URL or image filename.`);
  return '';
}

function getEmbeddedImages(workbook, worksheet) {
  const imagesByRow = new Map();
  for (const placement of worksheet.getImages()) {
    const rowNumber = Math.floor(placement.range.tl.nativeRow) + 1;
    if (imagesByRow.has(rowNumber)) continue;

    const image = workbook.getImage(Number.parseInt(placement.imageId, 10));
    if (!image?.buffer) continue;
    const extension = String(image.extension || '').toLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) continue;
    imagesByRow.set(rowNumber, { buffer: Buffer.from(image.buffer), extension });
  }
  return imagesByRow;
}

function rowHasData(worksheet, rowNumber, columns, hasEmbeddedImage) {
  if (hasEmbeddedImage) return true;
  return Object.values(columns).some((columnNumber) => cellText(worksheet.getRow(rowNumber).getCell(columnNumber)) !== '');
}

async function parseProductWorkbook(workbookSource, selectedCategory) {
  const category = String(selectedCategory || '').trim();
  if (!category) throw new Error('Please select or add a category before importing');
  if (category.length > 100) throw new Error('Category must be 100 characters or fewer');

  const workbook = new ExcelJS.Workbook();
  try {
    const options = { ignoreNodes: ['dataValidations', 'extLst'] };
    if (typeof workbookSource === 'string') {
      await workbook.xlsx.readFile(workbookSource, options);
    } else {
      await workbook.xlsx.load(workbookSource, options);
    }
  } catch {
    throw new Error('The uploaded file is not a valid .xlsx workbook');
  }

  let worksheet = null;
  let header = null;
  for (const candidate of workbook.worksheets) {
    const candidateHeader = findHeaderRow(candidate);
    if (candidateHeader) {
      worksheet = candidate;
      header = candidateHeader;
      break;
    }
  }

  if (!worksheet || !header) {
    throw new Error('No product table found. Add a header named "Name" or "Product Name" in the first 20 rows.');
  }

  const embeddedImages = getEmbeddedImages(workbook, worksheet);
  const products = [];
  const errors = [];
  const warnings = [];
  let totalImageBytes = 0;

  for (let rowNumber = header.rowNumber + 1; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
    const embeddedImage = embeddedImages.get(rowNumber);
    if (!rowHasData(worksheet, rowNumber, header.columns, Boolean(embeddedImage))) continue;

    const read = (field) => {
      const columnNumber = header.columns[field];
      return columnNumber ? cellText(worksheet.getRow(rowNumber).getCell(columnNumber)) : '';
    };

    const name = read('name').trim();
    if (!name) {
      errors.push(`Row ${rowNumber}: product name is required.`);
      continue;
    }
    if (name.length > 250) {
      errors.push(`Row ${rowNumber}: product name must be 250 characters or fewer.`);
      continue;
    }

    if (embeddedImage) {
      if (embeddedImage.buffer.length > MAX_IMAGE_BYTES) {
        errors.push(`Row ${rowNumber}: embedded image is larger than 10 MB.`);
        continue;
      }
      totalImageBytes += embeddedImage.buffer.length;
      if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
        errors.push('Embedded images exceed the 900 MB total import limit.');
        break;
      }
    }

    const badgeColorValue = read('badge_color');
    if (products.length >= MAX_PRODUCTS) {
      errors.push(`A maximum of ${MAX_PRODUCTS} products can be imported at once.`);
      break;
    }

    products.push({
      excelRow: rowNumber,
      category,
      manufacturer: read('manufacturer').slice(0, 200),
      name,
      description: read('description').slice(0, 5000),
      in_stock: parseStock(read('in_stock')),
      rating: parseNumber(read('rating'), 4.5, { min: 0, max: 5 }),
      reviews: parseNumber(read('reviews'), 0, { min: 0, integer: true }),
      image: embeddedImage ? '' : normalizeImageReference(read('image'), warnings, rowNumber),
      embeddedImage: embeddedImage || null,
      badge: read('badge').slice(0, 100),
      badge_color: BADGE_COLORS.has(badgeColorValue) ? badgeColorValue : 'bg-blue-500',
      price: parseNumber(read('price'), 0, { min: 0 }),
      old_price: parseNumber(read('old_price'), 0, { min: 0 }),
    });

  }

  if (errors.length) {
    const error = new Error('The workbook contains invalid product rows');
    error.details = errors.slice(0, 25);
    throw error;
  }
  if (!products.length) throw new Error('No product rows were found below the header');

  return {
    category,
    worksheetName: worksheet.name,
    headerRow: header.rowNumber,
    products,
    warnings: warnings.slice(0, 25),
  };
}

module.exports = {
  MAX_PRODUCTS,
  parseProductWorkbook,
};
