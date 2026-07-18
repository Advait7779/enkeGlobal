const path = require('path');
const os = require('os');

require('dotenv').config({ path: path.join(__dirname, '.env') });

function parseOrigins(value) {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || '',
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  enquiryToEmail: (process.env.ENQUIRY_TO_EMAIL || '').trim(),
  web3formsAccessKey: (process.env.WEB3FORMS_ACCESS_KEY || '').trim(),
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
  uploadDir: process.env.UPLOAD_DIR
    ? path.resolve(__dirname, process.env.UPLOAD_DIR)
    : path.resolve(__dirname, '../public/Images'),
  excelImportTempDir: process.env.EXCEL_IMPORT_TMP_DIR
    ? path.resolve(__dirname, process.env.EXCEL_IMPORT_TMP_DIR)
    : path.join(os.tmpdir(), 'enkeglobal-excel-imports'),
};
