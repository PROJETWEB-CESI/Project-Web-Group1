jest.mock('../src/invoices/invoices.model', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  count: jest.fn(),
}));

jest.mock('../src/payments/payments.model', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../src/common/utils/billing.util', () => ({
  generateReference: jest.fn().mockResolvedValue('F-2025-0001'),
}));

jest.mock('../src/events/event-publisher', () => ({
  publish: jest.fn(),
}));

const Invoice = require('../src/invoices/invoices.model');
const { generateReference } = require('../src/common/utils/billing.util');
const {
  getAllInvoices,
  getInvoiceById,
  getInvoicesByStudent,
  getOverdueInvoices,
  createInvoice,
  updateInvoice,
  advanceDunning,
  cancelInvoice,
  getBillingSummary,
  getBillingSummaryByCampus,
} = require('../src/invoices/invoices.service');

const makeMockInvoice = (overrides = {}) => ({
  id: 1,
  campusId: 1,
  studentId: 10,
  programmeId: null,
  reference: 'F-2025-0001',
  description: 'Tuition fee',
  totalAmount: '1000.00',
  paidAmount: '0.00',
  scholarshipAmount: '0.00',
  dueDate: new Date('2025-12-31'),
  status: 'pending',
  dunningLevel: null,
  lastReminderSentAt: null,
  adminNotes: null,
  payments: [],
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getAllInvoices ───────────────────────────────────────────────────────────

describe('getAllInvoices', () => {
  it('returns all invoices for a campus', async () => {
    const invoices = [makeMockInvoice()];
    Invoice.findAll.mockResolvedValue(invoices);

    const result = await getAllInvoices({ campusId: 1 });

    expect(Invoice.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { campusId: 1 } })
    );
    expect(result).toEqual(invoices);
  });

  it('filters by status when provided', async () => {
    Invoice.findAll.mockResolvedValue([]);

    await getAllInvoices({ campusId: 1, status: 'pending' });

    expect(Invoice.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { campusId: 1, status: 'pending' } })
    );
  });

  it('filters by studentId when provided', async () => {
    Invoice.findAll.mockResolvedValue([]);

    await getAllInvoices({ campusId: 1, studentId: 42 });

    expect(Invoice.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { campusId: 1, studentId: 42 } })
    );
  });

  it('combines status and studentId filters', async () => {
    Invoice.findAll.mockResolvedValue([]);

    await getAllInvoices({ campusId: 1, status: 'overdue', studentId: 5 });

    expect(Invoice.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { campusId: 1, status: 'overdue', studentId: 5 } })
    );
  });

  it('returns empty array when no invoices exist', async () => {
    Invoice.findAll.mockResolvedValue([]);

    const result = await getAllInvoices({ campusId: 99 });
    expect(result).toEqual([]);
  });

  it('forces status=overdue and adds dueDate gte filter for classification=retard', async () => {
    Invoice.findAll.mockResolvedValue([]);

    await getAllInvoices({ campusId: 1, classification: 'retard' });

    const call = Invoice.findAll.mock.calls[0][0];
    expect(call.where.status).toBe('overdue');
    expect(call.where.dueDate).toBeDefined();
    // retard = dueDate >= 6 months ago, so Op.gte is used
    const ops = Object.getOwnPropertySymbols(call.where.dueDate);
    expect(ops.length).toBe(1);
  });

  it('forces status=overdue and adds dueDate lt filter for classification=important', async () => {
    Invoice.findAll.mockResolvedValue([]);

    await getAllInvoices({ campusId: 1, classification: 'important' });

    const call = Invoice.findAll.mock.calls[0][0];
    expect(call.where.status).toBe('overdue');
    expect(call.where.dueDate).toBeDefined();
    const ops = Object.getOwnPropertySymbols(call.where.dueDate);
    expect(ops.length).toBe(1);
  });
});

// ─── getInvoiceById ──────────────────────────────────────────────────────────

describe('getInvoiceById', () => {
  it('returns invoice when found', async () => {
    const invoice = makeMockInvoice();
    Invoice.findOne.mockResolvedValue(invoice);

    const result = await getInvoiceById(1, 1);

    expect(Invoice.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, campusId: 1 } })
    );
    expect(result).toEqual(invoice);
  });

  it('throws 404 when invoice not found', async () => {
    Invoice.findOne.mockResolvedValue(null);

    await expect(getInvoiceById(999, 1)).rejects.toMatchObject({
      message: 'Invoice not found',
      status: 404,
    });
  });

  it('scopes lookup to campusId', async () => {
    Invoice.findOne.mockResolvedValue(null);

    await expect(getInvoiceById(1, 99)).rejects.toMatchObject({ status: 404 });
    expect(Invoice.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, campusId: 99 } })
    );
  });
});

// ─── getInvoicesByStudent ────────────────────────────────────────────────────

describe('getInvoicesByStudent', () => {
  it('returns invoices for a specific student', async () => {
    const invoices = [makeMockInvoice({ studentId: 5 })];
    Invoice.findAll.mockResolvedValue(invoices);

    const result = await getInvoicesByStudent(5, 1);

    expect(Invoice.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 5, campusId: 1 } })
    );
    expect(result).toEqual(invoices);
  });

  it('returns empty array when student has no invoices', async () => {
    Invoice.findAll.mockResolvedValue([]);

    const result = await getInvoicesByStudent(99, 1);
    expect(result).toEqual([]);
  });
});

// ─── getOverdueInvoices ──────────────────────────────────────────────────────

describe('getOverdueInvoices', () => {
  it('queries for pending invoices past their due date', async () => {
    const overdueInvoice = makeMockInvoice({ status: 'pending', dueDate: new Date('2020-01-01') });
    Invoice.findAll.mockResolvedValue([overdueInvoice]);

    const result = await getOverdueInvoices(1);

    expect(Invoice.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ campusId: 1, status: 'pending' }),
      })
    );
    expect(result).toEqual([overdueInvoice]);
  });

  it('returns empty array when no overdue invoices', async () => {
    Invoice.findAll.mockResolvedValue([]);

    const result = await getOverdueInvoices(1);
    expect(result).toEqual([]);
  });
});

// ─── createInvoice ───────────────────────────────────────────────────────────

describe('createInvoice', () => {
  it('creates invoice with auto-generated reference', async () => {
    const newInvoice = makeMockInvoice();
    generateReference.mockResolvedValue('F-2025-0001');
    Invoice.create.mockResolvedValue(newInvoice);

    const result = await createInvoice({
      campusId: 1,
      studentId: 10,
      description: 'Tuition fee',
      totalAmount: 1000,
      dueDate: '2025-12-31',
    });

    expect(generateReference).toHaveBeenCalledWith(1);
    expect(Invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        campusId: 1,
        studentId: 10,
        reference: 'F-2025-0001',
        description: 'Tuition fee',
        totalAmount: 1000,
        paidAmount: 0,
        status: 'pending',
      })
    );
    expect(result).toEqual(newInvoice);
  });

  it('defaults scholarshipAmount to 0 when not provided', async () => {
    Invoice.create.mockResolvedValue(makeMockInvoice());

    await createInvoice({
      campusId: 1,
      studentId: 10,
      description: 'Tuition',
      totalAmount: 500,
      dueDate: '2025-12-31',
    });

    expect(Invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({ scholarshipAmount: 0 })
    );
  });

  it('uses provided scholarshipAmount', async () => {
    Invoice.create.mockResolvedValue(makeMockInvoice());

    await createInvoice({
      campusId: 1,
      studentId: 10,
      description: 'Tuition',
      totalAmount: 1000,
      scholarshipAmount: 200,
      dueDate: '2025-12-31',
    });

    expect(Invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({ scholarshipAmount: 200 })
    );
  });

  it('always sets initial status to pending', async () => {
    Invoice.create.mockResolvedValue(makeMockInvoice());

    await createInvoice({ campusId: 1, studentId: 1, description: 'x', totalAmount: 100, dueDate: '2025-12-31' });

    expect(Invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', paidAmount: 0 })
    );
  });

  it('passes programmeId when provided', async () => {
    Invoice.create.mockResolvedValue(makeMockInvoice({ programmeId: 42 }));

    await createInvoice({
      campusId: 1,
      studentId: 10,
      programmeId: 42,
      description: 'Programme fee',
      totalAmount: 2000,
      dueDate: '2025-12-31',
    });

    expect(Invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({ programmeId: 42 })
    );
  });

  it('sets programmeId to null when not provided', async () => {
    Invoice.create.mockResolvedValue(makeMockInvoice());

    await createInvoice({ campusId: 1, studentId: 1, description: 'x', totalAmount: 100, dueDate: '2025-12-31' });

    expect(Invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({ programmeId: null })
    );
  });
});

// ─── updateInvoice ───────────────────────────────────────────────────────────

describe('updateInvoice', () => {
  it('updates allowed fields', async () => {
    const invoice = makeMockInvoice();
    Invoice.findOne.mockResolvedValue(invoice);

    await updateInvoice(1, 1, {
      description: 'Updated description',
      dueDate: '2026-01-01',
      status: 'overdue',
      adminNotes: 'Needs follow-up',
      scholarshipAmount: 100,
    });

    expect(invoice.description).toBe('Updated description');
    expect(invoice.status).toBe('overdue');
    expect(invoice.adminNotes).toBe('Needs follow-up');
    expect(invoice.scholarshipAmount).toBe(100);
    expect(invoice.save).toHaveBeenCalled();
  });

  it('ignores non-allowed fields (e.g. totalAmount, paidAmount)', async () => {
    const invoice = makeMockInvoice();
    Invoice.findOne.mockResolvedValue(invoice);

    await updateInvoice(1, 1, { totalAmount: 9999, paidAmount: 9999 });

    expect(invoice.totalAmount).toBe('1000.00');
    expect(invoice.paidAmount).toBe('0.00');
  });

  it('throws 404 if invoice not found', async () => {
    Invoice.findOne.mockResolvedValue(null);

    await expect(updateInvoice(999, 1, { description: 'x' })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('still calls save when no fields change', async () => {
    const invoice = makeMockInvoice();
    Invoice.findOne.mockResolvedValue(invoice);

    await updateInvoice(1, 1, {});

    expect(invoice.save).toHaveBeenCalled();
  });
});

// ─── advanceDunning ──────────────────────────────────────────────────────────

describe('advanceDunning', () => {
  it('advances from null to R1', async () => {
    const invoice = makeMockInvoice({ dunningLevel: null });
    Invoice.findOne.mockResolvedValue(invoice);

    await advanceDunning(1, 1);

    expect(invoice.dunningLevel).toBe('R1');
    expect(invoice.lastReminderSentAt).toBeInstanceOf(Date);
    expect(invoice.save).toHaveBeenCalled();
  });

  it('advances from R1 to R2', async () => {
    const invoice = makeMockInvoice({ dunningLevel: 'R1', status: 'overdue' });
    Invoice.findOne.mockResolvedValue(invoice);

    await advanceDunning(1, 1);
    expect(invoice.dunningLevel).toBe('R2');
  });

  it('advances from R2 to R3', async () => {
    const invoice = makeMockInvoice({ dunningLevel: 'R2', status: 'overdue' });
    Invoice.findOne.mockResolvedValue(invoice);

    await advanceDunning(1, 1);
    expect(invoice.dunningLevel).toBe('R3');
  });

  it('throws 400 when already at maximum level R3', async () => {
    const invoice = makeMockInvoice({ dunningLevel: 'R3', status: 'overdue' });
    Invoice.findOne.mockResolvedValue(invoice);

    await expect(advanceDunning(1, 1)).rejects.toMatchObject({
      message: 'Invoice is already at the maximum dunning level (R3)',
      status: 400,
    });
  });

  it('sets status to overdue when invoice was pending', async () => {
    const invoice = makeMockInvoice({ status: 'pending', dunningLevel: null });
    Invoice.findOne.mockResolvedValue(invoice);

    await advanceDunning(1, 1);
    expect(invoice.status).toBe('overdue');
  });

  it('does not change status when already overdue', async () => {
    const invoice = makeMockInvoice({ status: 'overdue', dunningLevel: 'R1' });
    Invoice.findOne.mockResolvedValue(invoice);

    await advanceDunning(1, 1);
    expect(invoice.status).toBe('overdue');
  });

  it('records lastReminderSentAt timestamp', async () => {
    const before = new Date();
    const invoice = makeMockInvoice({ dunningLevel: null });
    Invoice.findOne.mockResolvedValue(invoice);

    await advanceDunning(1, 1);

    expect(invoice.lastReminderSentAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('throws 404 if invoice not found', async () => {
    Invoice.findOne.mockResolvedValue(null);

    await expect(advanceDunning(999, 1)).rejects.toMatchObject({ status: 404 });
  });
});

// ─── cancelInvoice ───────────────────────────────────────────────────────────

describe('cancelInvoice', () => {
  it('sets status to cancelled', async () => {
    const invoice = makeMockInvoice({ status: 'pending' });
    Invoice.findOne.mockResolvedValue(invoice);

    await cancelInvoice(1, 1);

    expect(invoice.status).toBe('cancelled');
    expect(invoice.save).toHaveBeenCalled();
  });

  it('throws 400 when invoice is already paid', async () => {
    Invoice.findOne.mockResolvedValue(makeMockInvoice({ status: 'paid' }));

    await expect(cancelInvoice(1, 1)).rejects.toMatchObject({
      message: 'Cannot cancel an invoice with status "paid"',
      status: 400,
    });
  });

  it('throws 400 when invoice is already cancelled', async () => {
    Invoice.findOne.mockResolvedValue(makeMockInvoice({ status: 'cancelled' }));

    await expect(cancelInvoice(1, 1)).rejects.toMatchObject({
      message: 'Cannot cancel an invoice with status "cancelled"',
      status: 400,
    });
  });

  it('allows cancelling overdue invoices', async () => {
    const invoice = makeMockInvoice({ status: 'overdue' });
    Invoice.findOne.mockResolvedValue(invoice);

    await cancelInvoice(1, 1);
    expect(invoice.status).toBe('cancelled');
  });

  it('allows cancelling on_hold invoices', async () => {
    const invoice = makeMockInvoice({ status: 'on_hold' });
    Invoice.findOne.mockResolvedValue(invoice);

    await cancelInvoice(1, 1);
    expect(invoice.status).toBe('cancelled');
  });

  it('throws 404 if invoice not found', async () => {
    Invoice.findOne.mockResolvedValue(null);

    await expect(cancelInvoice(999, 1)).rejects.toMatchObject({ status: 404 });
  });
});

// ─── getBillingSummary ───────────────────────────────────────────────────────

describe('getBillingSummary', () => {
  it('returns correct aggregate figures', async () => {
    const invoices = [
      makeMockInvoice({ totalAmount: '500.00', paidAmount: '500.00', status: 'paid', payments: [] }),
      makeMockInvoice({ totalAmount: '300.00', paidAmount: '100.00', status: 'overdue', dueDate: new Date(), payments: [] }),
      makeMockInvoice({ totalAmount: '200.00', paidAmount: '0.00', status: 'pending', payments: [] }),
    ];
    Invoice.findAll.mockResolvedValue(invoices);

    const result = await getBillingSummary(1);

    expect(result.totalInvoiced).toBe('1000.00');
    expect(result.totalCollected).toBe('600.00');
    expect(result.totalOverdue).toBe('200.00');
    expect(result.overdueCount).toBe(1);
  });

  it('returns percentageCollected as formatted string', async () => {
    const invoices = [
      makeMockInvoice({ totalAmount: '1000.00', paidAmount: '762.00', status: 'paid', payments: [] }),
    ];
    Invoice.findAll.mockResolvedValue(invoices);

    const result = await getBillingSummary(1);

    expect(result.percentageCollected).toBe('76.2');
  });

  it('returns percentageCollected as 0.0 when totalInvoiced is 0', async () => {
    Invoice.findAll.mockResolvedValue([]);

    const result = await getBillingSummary(99);

    expect(result.percentageCollected).toBe('0.0');
    expect(result.averageRecoveryDays).toBeNull();
  });

  it('computes averageRecoveryDays for paid invoices', async () => {
    const dueDate = new Date('2025-01-01');
    const paidAt = new Date('2025-01-11'); // 10 days after due date
    const invoices = [
      makeMockInvoice({
        totalAmount: '1000.00',
        paidAmount: '1000.00',
        status: 'paid',
        dueDate,
        payments: [{ status: 'completed', paidAt }],
      }),
    ];
    Invoice.findAll.mockResolvedValue(invoices);

    const result = await getBillingSummary(1);

    expect(result.averageRecoveryDays).toBe(10);
  });

  it('returns null averageRecoveryDays when no paid invoices', async () => {
    Invoice.findAll.mockResolvedValue([
      makeMockInvoice({ status: 'overdue', dueDate: new Date(), payments: [] }),
    ]);

    const result = await getBillingSummary(1);

    expect(result.averageRecoveryDays).toBeNull();
  });

  it('classifies overdue invoices into retard and important buckets', async () => {
    const recentOverdue = makeMockInvoice({
      status: 'overdue',
      dueDate: new Date(), // today → retard (< 6 months overdue)
      payments: [],
    });
    const oldOverdue = makeMockInvoice({
      id: 2,
      status: 'overdue',
      dueDate: new Date('2020-01-01'), // > 6 months → important
      payments: [],
    });
    Invoice.findAll.mockResolvedValue([recentOverdue, oldOverdue]);

    const result = await getBillingSummary(1);

    expect(result.overdueByClassification.retard).toBe(1);
    expect(result.overdueByClassification.important).toBe(1);
  });

  it('returns zeros for a campus with no invoices', async () => {
    Invoice.findAll.mockResolvedValue([]);

    const result = await getBillingSummary(99);

    expect(result.totalInvoiced).toBe('0.00');
    expect(result.totalCollected).toBe('0.00');
    expect(result.totalOverdue).toBe('0.00');
    expect(result.overdueCount).toBe(0);
    expect(result.overdueByClassification).toEqual({ retard: 0, important: 0 });
  });

  it('returns string values formatted to 2 decimal places', async () => {
    const invoices = [
      makeMockInvoice({ totalAmount: '100.1', paidAmount: '33.3', status: 'overdue', dueDate: new Date(), payments: [] }),
    ];
    Invoice.findAll.mockResolvedValue(invoices);

    const result = await getBillingSummary(1);

    expect(result.totalInvoiced).toMatch(/^\d+\.\d{2}$/);
    expect(result.totalCollected).toMatch(/^\d+\.\d{2}$/);
    expect(result.totalOverdue).toMatch(/^\d+\.\d{2}$/);
  });
});

// ─── getBillingSummaryByCampus ───────────────────────────────────────────────

describe('getBillingSummaryByCampus', () => {
  it('returns an array grouped by campusId', async () => {
    const invoices = [
      { campusId: 1, totalAmount: '500.00', paidAmount: '500.00', status: 'paid' },
      { campusId: 1, totalAmount: '300.00', paidAmount: '100.00', status: 'overdue' },
      { campusId: 2, totalAmount: '200.00', paidAmount: '0.00', status: 'pending' },
    ];
    Invoice.findAll.mockResolvedValue(invoices);

    const result = await getBillingSummaryByCampus();

    expect(result).toHaveLength(2);
    const campus1 = result.find((r) => r.campusId === 1);
    const campus2 = result.find((r) => r.campusId === 2);

    expect(campus1).toBeDefined();
    expect(campus1.totalInvoiced).toBe('800.00');
    expect(campus1.totalCollected).toBe('600.00');
    expect(campus1.overdueCount).toBe(1);

    expect(campus2).toBeDefined();
    expect(campus2.totalInvoiced).toBe('200.00');
    expect(campus2.overdueCount).toBe(0);
  });

  it('returns empty array when no invoices', async () => {
    Invoice.findAll.mockResolvedValue([]);

    const result = await getBillingSummaryByCampus();
    expect(result).toEqual([]);
  });

  it('does not scope by campusId (no where.campusId in the query)', async () => {
    Invoice.findAll.mockResolvedValue([]);

    await getBillingSummaryByCampus();

    const call = Invoice.findAll.mock.calls[0][0];
    expect(call.where).not.toHaveProperty('campusId');
  });

  it('formats monetary totals to 2 decimal places', async () => {
    Invoice.findAll.mockResolvedValue([
      { campusId: 3, totalAmount: '100.1', paidAmount: '33.3', status: 'overdue' },
    ]);

    const result = await getBillingSummaryByCampus();

    const campus3 = result.find((r) => r.campusId === 3);
    expect(campus3.totalInvoiced).toMatch(/^\d+\.\d{2}$/);
    expect(campus3.totalCollected).toMatch(/^\d+\.\d{2}$/);
    expect(campus3.totalOverdue).toMatch(/^\d+\.\d{2}$/);
  });
});
