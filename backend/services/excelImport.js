const path = require('path');
const ExcelJS = require('exceljs');

const MAX_PRODUCTS = 10000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 900 * 1024 * 1024;

const HEADER_ALIASES = {
  name: ['name', 'productname', 'product', 'producttitle', 'title', 'partnumber', 'partno', 'sku', 'model', 'modelno', 'modelnumber'],
  manufacturer: ['manufacturer', 'brand', 'make', 'company', 'mfg'],
  description: ['description', 'productdescription', 'details', 'specification', 'specifications', 'desc'],
  in_stock: ['instock', 'stock', 'availability', 'available', 'qty', 'quantity'],
  rating: ['rating', 'stars'],
  reviews: ['reviews', 'reviewcount', 'numberofreviews'],
  image: ['image', 'imageurl', 'imagepath', 'photo', 'picture', 'pic', 'pics'],
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

const SHEET_CATEGORY_MAP = {
  'pneum': 'Pneumatic',
  'pneumatic': 'Pneumatic',
  'pneumatics': 'Pneumatic',
  'mech': 'Mechanical',
  'mechanical': 'Mechanical',
  'misc': 'Miscellaneous',
  'msc': 'Miscellaneous',
  'miscellaneous': 'Miscellaneous',
  'elec': 'Electrical',
  'electrical': 'Electrical',
  'sensors': 'Sensors',
  'sensor': 'Sensors',
  'etrx': 'Electronic',
  'electronic': 'Electronic',
  'electronics': 'Electronic',
  'plc': 'PLC',
  'plcs': 'PLC',
  'inst': 'Instruments',
  'instr': 'Instruments',
  'instrument': 'Instruments',
  'instruments': 'Instruments',
  'safety': 'Safety',
  'safeties': 'Safety',
  'diesel': 'Diesel Engines',
  'engine': 'Engines',
  'generator': 'Generators',
  'hydraulic': 'Hydraulic',
  'bearing': 'Bearings',
  'valve': 'Valves',
  'pump': 'Pumps',
};

function resolveCategoryFromSheetName(rawName) {
  const clean = String(rawName || '')
    .trim()
    .replace(/^[a-z0-9]+[\s_.-]+/i, '') // remove prefix e.g. "A-", "B-", "1."
    .trim();

  const lookupKey = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (SHEET_CATEGORY_MAP[lookupKey]) {
    return SHEET_CATEGORY_MAP[lookupKey];
  }

  // Format to Title Case
  const formatted = clean
    .split(/[\s_-]+/)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');

  return formatted || 'General';
}

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
    if (columns.name || columns.description || columns.manufacturer) {
      return { rowNumber, columns };
    }
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

function normalizeImageReference(value, warnings, rowNumber, sheetName) {
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

  warnings.push(`Sheet "${sheetName}" Row ${rowNumber}: image reference was ignored; embed the image or use an HTTP URL.`);
  return '';
}

function getEmbeddedImages(workbook, worksheet) {
  const imagesByRow = new Map();
  if (typeof worksheet.getImages !== 'function') return imagesByRow;

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
  const isAutoCategory = !selectedCategory || selectedCategory === '__auto__' || selectedCategory === 'auto';
  const fixedCategory = !isAutoCategory ? String(selectedCategory).trim() : null;

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

  const products = [];
  const errors = [];
  const warnings = [];
  const categoriesDetected = new Set();
  const parsedWorksheets = [];
  let totalImageBytes = 0;

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name || 'Sheet';
    if (/empty|template|blank/i.test(sheetName)) {
      continue;
    }

    const header = findHeaderRow(worksheet);
    if (!header) continue;

    const sheetCategory = fixedCategory || resolveCategoryFromSheetName(sheetName);
    const embeddedImages = getEmbeddedImages(workbook, worksheet);
    let sheetProductCount = 0;

    for (let rowNumber = header.rowNumber + 1; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
      const embeddedImage = embeddedImages.get(rowNumber);
      if (!rowHasData(worksheet, rowNumber, header.columns, Boolean(embeddedImage))) continue;

      const read = (field) => {
        const columnNumber = header.columns[field];
        return columnNumber ? cellText(worksheet.getRow(rowNumber).getCell(columnNumber)) : '';
      };

      const rawMake = read('manufacturer').trim();
      const rawModel = read('name').trim();
      const rawDesc = read('description').trim();

      // Smart name resolution: Model -> Description
      let name = rawModel;
      if (!name && rawDesc) {
        name = rawDesc.length > 80 ? rawDesc.slice(0, 80) : rawDesc;
      }

      if (!name) {
        errors.push(`Sheet "${sheetName}" Row ${rowNumber}: product name is required.`);
        continue;
      }
      if (name.length > 250) {
        name = name.slice(0, 250);
      }

      if (embeddedImage) {
        if (embeddedImage.buffer.length > MAX_IMAGE_BYTES) {
          warnings.push(`Sheet "${sheetName}" Row ${rowNumber}: embedded image exceeds 10 MB and was skipped.`);
        } else {
          totalImageBytes += embeddedImage.buffer.length;
          if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
            warnings.push('Total embedded images exceeded limit. Remaining images were skipped.');
          }
        }
      }

      const validImage = embeddedImage && embeddedImage.buffer.length <= MAX_IMAGE_BYTES && totalImageBytes <= MAX_TOTAL_IMAGE_BYTES ? embeddedImage : null;
      const badgeColorValue = read('badge_color');

      if (products.length >= MAX_PRODUCTS) {
        warnings.push(`Reached maximum limit of ${MAX_PRODUCTS} products.`);
        break;
      }

      products.push({
        excelRow: rowNumber,
        sheetName,
        category: sheetCategory,
        manufacturer: rawMake.slice(0, 200),
        name,
        description: rawDesc.slice(0, 5000),
        in_stock: parseStock(read('in_stock')),
        rating: parseNumber(read('rating'), 4.5, { min: 0, max: 5 }),
        reviews: parseNumber(read('reviews'), 0, { min: 0, integer: true }),
        image: validImage ? '' : normalizeImageReference(read('image'), warnings, rowNumber, sheetName),
        embeddedImage: validImage,
        badge: read('badge').slice(0, 100),
        badge_color: BADGE_COLORS.has(badgeColorValue) ? badgeColorValue : 'bg-blue-500',
        price: parseNumber(read('price'), 0, { min: 0 }),
        old_price: parseNumber(read('old_price'), 0, { min: 0 }),
      });
      sheetProductCount += 1;
    }

    if (sheetProductCount > 0) {
      categoriesDetected.add(sheetCategory);
      parsedWorksheets.push(sheetName);
    }
  }

  if (errors.length > 0) {
    const error = new Error('The workbook contains invalid product rows');
    error.details = errors.slice(0, 25);
    throw error;
  }

  if (!products.length) {
    throw new Error('No product rows were found in the workbook sheets. Make sure your sheets have columns like Make, Model, or Description.');
  }

  return {
    isMultiCategory: isAutoCategory,
    category: isAutoCategory ? Array.from(categoriesDetected).join(', ') : fixedCategory,
    categoriesDetected: Array.from(categoriesDetected),
    worksheetName: parsedWorksheets.join(', '),
    products,
    warnings: [...warnings, ...errors].slice(0, 30),
  };
}

module.exports = {
  MAX_PRODUCTS,
  parseProductWorkbook,
  resolveCategoryFromSheetName,
};
