const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ExcelJS = require('exceljs');
const { parseProductWorkbook } = require('../services/excelImport');

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

test('parses product rows, overrides category, and extracts embedded row images', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Products');
  sheet.addRow(['Product Name', 'Manufacturer', 'Description', 'In Stock', 'Price', 'Image']);
  sheet.addRow(['Embedded Image Product', 'Acme', 'First product', 'Yes', 1250, '']);
  sheet.addRow(['URL Image Product', 'Beta', 'Second product', 'No', 500, 'https://example.com/product.png']);

  const imageId = workbook.addImage({ buffer: ONE_PIXEL_PNG, extension: 'png' });
  sheet.addImage(imageId, {
    tl: { col: 5, row: 1 },
    ext: { width: 30, height: 30 },
  });

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'enke-excel-test-'));
  const workbookPath = path.join(tempDir, 'products.xlsx');
  await workbook.xlsx.writeFile(workbookPath);
  const parsed = await parseProductWorkbook(workbookPath, 'Electronic');

  assert.equal(parsed.category, 'Electronic');
  assert.equal(parsed.worksheetName, 'Products');
  assert.equal(parsed.products.length, 2);
  assert.equal(parsed.products[0].name, 'Embedded Image Product');
  assert.equal(parsed.products[0].category, 'Electronic');
  assert.equal(parsed.products[0].embeddedImage.extension, 'png');
  assert.deepEqual(parsed.products[0].embeddedImage.buffer, ONE_PIXEL_PNG);
  assert.equal(parsed.products[1].image, 'https://example.com/product.png');
  assert.equal(parsed.products[1].in_stock, false);

  await fs.promises.unlink(workbookPath);
  await fs.promises.rmdir(tempDir);
});

test('rejects workbooks with invalid product rows without returning a partial import', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Products');
  sheet.addRow(['Name', 'Manufacturer']);
  sheet.addRow(['', 'Missing product name']);

  const buffer = await workbook.xlsx.writeBuffer();
  await assert.rejects(
    () => parseProductWorkbook(buffer, 'Mechanical'),
    (error) => Array.isArray(error.details) && error.details[0].includes('product name is required')
  );
});

test('auto-detects categories across multiple sheets and handles Model/Description fallback', async () => {
  const workbook = new ExcelJS.Workbook();
  
  // Empty sheet
  workbook.addWorksheet('A-EMPTY');

  // Pneumatic sheet
  const sheet1 = workbook.addWorksheet('B-PNEUM');
  sheet1.addRow(['Sr.', 'Make', 'Model', 'Description']);
  sheet1.addRow([1, 'CAMOZZI', '27M2A40A080', 'PNEUMATIC CYLINDER Round 40mm']);
  sheet1.addRow([2, 'SPAC', '', 'AUTO DRAIN VALVE HIGH FLOW']); // Blank model -> fallback to description

  // Mechanical sheet
  const sheet2 = workbook.addWorksheet('C-MECH');
  sheet2.addRow(['Sr.', 'Make', 'Model', 'Description']);
  sheet2.addRow([1, 'SKF', '6204-2RS', 'DEEP GROOVE BALL BEARING']);

  const buffer = await workbook.xlsx.writeBuffer();
  const parsed = await parseProductWorkbook(buffer, '__auto__');

  assert.equal(parsed.isMultiCategory, true);
  assert.equal(parsed.products.length, 3);
  assert.deepEqual(parsed.categoriesDetected, ['Pneumatic', 'Mechanical']);

  // Product 1
  assert.equal(parsed.products[0].name, '27M2A40A080');
  assert.equal(parsed.products[0].manufacturer, 'CAMOZZI');
  assert.equal(parsed.products[0].category, 'Pneumatic');

  // Product 2 (blank model -> used description)
  assert.equal(parsed.products[1].name, 'AUTO DRAIN VALVE HIGH FLOW');
  assert.equal(parsed.products[1].manufacturer, 'SPAC');
  assert.equal(parsed.products[1].category, 'Pneumatic');

  // Product 3
  assert.equal(parsed.products[2].name, '6204-2RS');
  assert.equal(parsed.products[2].manufacturer, 'SKF');
  assert.equal(parsed.products[2].category, 'Mechanical');
});

