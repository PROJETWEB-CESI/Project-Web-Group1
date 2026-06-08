jest.mock('../src/invoices/invoices.model', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../src/payments/payments.model', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
}));

const Invoice = require('../src/invoices/invoices.model');
const Payment = require('../src/payments/payments.model');
const {
  getPaymentsByInvoice,
  getPaymentById,
  recordPayment,
  updatePaymentStatus,
} = require('../src/payments/payments.service');

const makeMockInvoice = (overrides = {}) => ({
  id: 1,
  campusId: 1,
  totalAmount: '1000.00',
  paidAmount: '0.00',
  scholarshipAmount: '0.00',
  status: 'pending',
  dunningLevel: null,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeMockPayment = (overrides = {}) => ({
  id: 1,
  invoiceId: 1,
  amount: '200.00',
  method: 'card',
  status: 'completed',
  paidAt: new Date(),
  transactionReference: null,
  notes: null,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getPaymentsByInvoice ────────────────────────────────────────────────────

describe('getPaymentsByInvoice', () => {
  it('returns payments when invoice belongs to campus', async () => {
    const invoice = makeMockInvoice();
    const payments = [makeMockPayment()];
    Invoice.findOne.mockResolvedValue(invoice);
    Payment.findAll.mockResolvedValue(payments);

    const result = await getPaymentsByInvoice(1, 1);

    expect(Invoice.findOne).toHaveBeenCalledWith({ where: { id: 1, campusId: 1 } });
    expect(Payment.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { invoiceId: 1 } })
    );
    expect(result).toEqual(payments);
  });

  it('throws 404 when invoice does not belong to campus', async () => {
    Invoice.findOne.mockResolvedValue(null);

    await expect(getPaymentsByInvoice(1, 99)).rejects.toMatchObject({
      message: 'Invoice not found',
      status: 404,
    });
    expect(Payment.findAll).not.toHaveBeenCalled();
  });

  it('returns empty array when invoice has no payments', async () => {
    Invoice.findOne.mockResolvedValue(makeMockInvoice());
    Payment.findAll.mockResolvedValue([]);

    const result = await getPaymentsByInvoice(1, 1);
    expect(result).toEqual([]);
  });
});

// ─── getPaymentById ──────────────────────────────────────────────────────────

describe('getPaymentById', () => {
  it('returns payment with associated invoice', async () => {
    const payment = makeMockPayment();
    Payment.findByPk.mockResolvedValue(payment);

    const result = await getPaymentById(1);

    expect(Payment.findByPk).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ include: expect.any(Array) })
    );
    expect(result).toEqual(payment);
  });

  it('throws 404 when payment not found', async () => {
    Payment.findByPk.mockResolvedValue(null);

    await expect(getPaymentById(999)).rejects.toMatchObject({
      message: 'Payment not found',
      status: 404,
    });
  });
});

// ─── recordPayment ───────────────────────────────────────────────────────────

describe('recordPayment', () => {
  it('creates a payment record with status completed', async () => {
    const invoice = makeMockInvoice();
    const newPayment = makeMockPayment({ amount: '300.00' });
    Invoice.findOne.mockResolvedValue(invoice);
    Payment.create.mockResolvedValue(newPayment);

    const result = await recordPayment({ invoiceId: 1, campusId: 1, amount: 300, method: 'card' });

    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId: 1,
        amount: 300,
        method: 'card',
        status: 'completed',
      })
    );
    expect(result).toEqual(newPayment);
  });

  it('updates invoice paidAmount after payment', async () => {
    const invoice = makeMockInvoice({ paidAmount: '200.00' });
    Invoice.findOne.mockResolvedValue(invoice);
    Payment.create.mockResolvedValue(makeMockPayment());

    await recordPayment({ invoiceId: 1, campusId: 1, amount: 300, method: 'card' });

    expect(invoice.paidAmount).toBe('500.00');
    expect(invoice.save).toHaveBeenCalled();
  });

  it('marks invoice as paid when full amount is received', async () => {
    const invoice = makeMockInvoice({ totalAmount: '1000.00', paidAmount: '700.00' });
    Invoice.findOne.mockResolvedValue(invoice);
    Payment.create.mockResolvedValue(makeMockPayment());

    await recordPayment({ invoiceId: 1, campusId: 1, amount: 300, method: 'card' });

    expect(invoice.status).toBe('paid');
    expect(invoice.dunningLevel).toBeNull();
  });

  it('clears dunning level when invoice becomes paid', async () => {
    const invoice = makeMockInvoice({ totalAmount: '1000.00', paidAmount: '700.00', dunningLevel: 'R2' });
    Invoice.findOne.mockResolvedValue(invoice);
    Payment.create.mockResolvedValue(makeMockPayment());

    await recordPayment({ invoiceId: 1, campusId: 1, amount: 300, method: 'card' });

    expect(invoice.dunningLevel).toBeNull();
  });

  it('accounts for scholarship when computing net owed', async () => {
    const invoice = makeMockInvoice({ totalAmount: '1000.00', paidAmount: '0.00', scholarshipAmount: '200.00' });
    Invoice.findOne.mockResolvedValue(invoice);
    Payment.create.mockResolvedValue(makeMockPayment());

    await recordPayment({ invoiceId: 1, campusId: 1, amount: 800, method: 'bank_transfer' });

    expect(invoice.status).toBe('paid');
  });

  it('keeps status pending for partial payment on pending invoice', async () => {
    const invoice = makeMockInvoice({ totalAmount: '1000.00', paidAmount: '0.00', status: 'pending' });
    Invoice.findOne.mockResolvedValue(invoice);
    Payment.create.mockResolvedValue(makeMockPayment());

    await recordPayment({ invoiceId: 1, campusId: 1, amount: 200, method: 'card' });

    expect(invoice.status).toBe('pending');
  });

  it('keeps overdue status for partial payment on overdue invoice', async () => {
    const invoice = makeMockInvoice({ totalAmount: '1000.00', paidAmount: '0.00', status: 'overdue' });
    Invoice.findOne.mockResolvedValue(invoice);
    Payment.create.mockResolvedValue(makeMockPayment());

    await recordPayment({ invoiceId: 1, campusId: 1, amount: 200, method: 'card' });

    expect(invoice.status).toBe('overdue');
  });

  it('throws 404 when invoice not found', async () => {
    Invoice.findOne.mockResolvedValue(null);

    await expect(
      recordPayment({ invoiceId: 999, campusId: 1, amount: 100, method: 'card' })
    ).rejects.toMatchObject({ message: 'Invoice not found', status: 404 });
  });

  it('throws 400 when invoice is cancelled', async () => {
    Invoice.findOne.mockResolvedValue(makeMockInvoice({ status: 'cancelled' }));

    await expect(
      recordPayment({ invoiceId: 1, campusId: 1, amount: 100, method: 'card' })
    ).rejects.toMatchObject({
      message: 'Cannot record a payment on a cancelled invoice',
      status: 400,
    });
  });

  it('uses provided paidAt date', async () => {
    const invoice = makeMockInvoice();
    Invoice.findOne.mockResolvedValue(invoice);
    Payment.create.mockResolvedValue(makeMockPayment());
    const specificDate = new Date('2025-06-01T12:00:00Z');

    await recordPayment({ invoiceId: 1, campusId: 1, amount: 100, method: 'cash', paidAt: specificDate });

    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ paidAt: specificDate })
    );
  });

  it('defaults paidAt to current date when not provided', async () => {
    Invoice.findOne.mockResolvedValue(makeMockInvoice());
    Payment.create.mockResolvedValue(makeMockPayment());

    await recordPayment({ invoiceId: 1, campusId: 1, amount: 100, method: 'cash' });

    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ paidAt: expect.any(Date) })
    );
  });

  it('sets transactionReference and notes to null when not provided', async () => {
    Invoice.findOne.mockResolvedValue(makeMockInvoice());
    Payment.create.mockResolvedValue(makeMockPayment());

    await recordPayment({ invoiceId: 1, campusId: 1, amount: 100, method: 'cash' });

    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ transactionReference: null, notes: null })
    );
  });

  it('stores provided transactionReference and notes', async () => {
    Invoice.findOne.mockResolvedValue(makeMockInvoice());
    Payment.create.mockResolvedValue(makeMockPayment());

    await recordPayment({
      invoiceId: 1,
      campusId: 1,
      amount: 100,
      method: 'bank_transfer',
      transactionReference: 'TXN-ABC-123',
      notes: 'Bank wire received',
    });

    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionReference: 'TXN-ABC-123',
        notes: 'Bank wire received',
      })
    );
  });
});

// ─── updatePaymentStatus ─────────────────────────────────────────────────────

describe('updatePaymentStatus', () => {
  it('updates payment status', async () => {
    const invoice = makeMockInvoice({ paidAmount: '300.00' });
    const payment = makeMockPayment({ status: 'pending', invoiceId: 1 });
    Payment.findByPk.mockResolvedValue(payment);
    Invoice.findOne.mockResolvedValue(invoice);

    const result = await updatePaymentStatus(1, 1, 'completed');

    expect(payment.status).toBe('completed');
    expect(payment.save).toHaveBeenCalled();
    expect(result).toEqual(payment);
  });

  it('reduces invoice paidAmount when refunding a completed payment', async () => {
    const invoice = makeMockInvoice({ paidAmount: '300.00', status: 'pending' });
    const payment = makeMockPayment({ status: 'completed', amount: '200.00', invoiceId: 1 });
    Payment.findByPk.mockResolvedValue(payment);
    Invoice.findOne.mockResolvedValue(invoice);

    await updatePaymentStatus(1, 1, 'refunded');

    expect(payment.status).toBe('refunded');
    expect(invoice.paidAmount).toBe('100.00');
    expect(invoice.save).toHaveBeenCalled();
  });

  it('reopens a paid invoice when payment is fully refunded', async () => {
    const invoice = makeMockInvoice({ paidAmount: '1000.00', status: 'paid' });
    const payment = makeMockPayment({ status: 'completed', amount: '1000.00', invoiceId: 1 });
    Payment.findByPk.mockResolvedValue(payment);
    Invoice.findOne.mockResolvedValue(invoice);

    await updatePaymentStatus(1, 1, 'refunded');

    expect(invoice.status).toBe('pending');
  });

  it('does not modify invoice when marking as failed (only refund triggers adjustment)', async () => {
    const invoice = makeMockInvoice({ paidAmount: '300.00', status: 'pending' });
    const payment = makeMockPayment({ status: 'completed', invoiceId: 1 });
    Payment.findByPk.mockResolvedValue(payment);
    Invoice.findOne.mockResolvedValue(invoice);

    await updatePaymentStatus(1, 1, 'failed');

    expect(invoice.paidAmount).toBe('300.00');
    expect(invoice.save).not.toHaveBeenCalled();
  });

  it('does not modify invoice when marking a pending payment as refunded', async () => {
    const invoice = makeMockInvoice({ paidAmount: '300.00', status: 'pending' });
    const payment = makeMockPayment({ status: 'pending', invoiceId: 1 });
    Payment.findByPk.mockResolvedValue(payment);
    Invoice.findOne.mockResolvedValue(invoice);

    await updatePaymentStatus(1, 1, 'refunded');

    expect(invoice.paidAmount).toBe('300.00');
    expect(invoice.save).not.toHaveBeenCalled();
  });

  it('clamps paidAmount to 0 to avoid negative values', async () => {
    const invoice = makeMockInvoice({ paidAmount: '50.00', status: 'pending' });
    const payment = makeMockPayment({ status: 'completed', amount: '200.00', invoiceId: 1 });
    Payment.findByPk.mockResolvedValue(payment);
    Invoice.findOne.mockResolvedValue(invoice);

    await updatePaymentStatus(1, 1, 'refunded');

    expect(parseFloat(invoice.paidAmount)).toBeGreaterThanOrEqual(0);
    expect(invoice.paidAmount).toBe('0.00');
  });

  it('throws 404 when payment not found', async () => {
    Payment.findByPk.mockResolvedValue(null);

    await expect(updatePaymentStatus(999, 1, 'refunded')).rejects.toMatchObject({
      message: 'Payment not found',
      status: 404,
    });
  });

  it('throws 404 when campus does not own the invoice', async () => {
    const payment = makeMockPayment({ status: 'completed', invoiceId: 1 });
    Payment.findByPk.mockResolvedValue(payment);
    Invoice.findOne.mockResolvedValue(null);

    await expect(updatePaymentStatus(1, 99, 'refunded')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('verifies campus ownership via invoice lookup', async () => {
    const invoice = makeMockInvoice({ campusId: 2 });
    const payment = makeMockPayment({ status: 'completed', invoiceId: 1 });
    Payment.findByPk.mockResolvedValue(payment);
    Invoice.findOne.mockResolvedValue(invoice);

    await updatePaymentStatus(1, 2, 'failed');

    expect(Invoice.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: payment.invoiceId, campusId: 2 } })
    );
  });
});
