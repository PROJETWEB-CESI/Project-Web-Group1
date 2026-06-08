const Invoice = require('../../invoices/invoices.model');

async function generateReference(campusId) {
  const year = new Date().getFullYear();
  const count = await Invoice.count({ where: { campusId } });
  const seq = String(count + 1).padStart(4, '0');
  return `F-${year}-${seq}`;
}

module.exports = { generateReference };
