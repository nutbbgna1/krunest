import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartSummary,
  calculateSubscriptionBilling,
  filterPrograms,
  calculateTaxInvoice,
} from './pricing';
import { SOFTWARE_PROGRAMS, SUBSCRIPTION_PLANS } from '../data/programs';

test('calculateCartSummary computes single item and 7% VAT accurately', () => {
  const summary = calculateCartSummary([
    {
      programId: 'flowsync-erp',
      programName: 'FlowSync ERP & Stock',
      thaiName: 'ระบบจัดการคลังสินค้า',
      licenseType: 'lifetime_desktop',
      unitPrice: 6900,
      quantity: 1,
    },
  ]);

  assert.equal(summary.subtotal, 6900);
  assert.equal(summary.bundleDiscount, 0);
  assert.equal(summary.promoDiscount, 0);
  assert.equal(summary.vatAmount, 483);
  assert.equal(summary.grandTotal, 7383);
});

test('calculateCartSummary applies 10% multi-program bundle discount and LAUNCH20 promo code', () => {
  const summary = calculateCartSummary(
    [
      {
        programId: 'flowsync-erp',
        programName: 'FlowSync ERP',
        thaiName: 'ระบบสต็อก',
        licenseType: 'monthly_cloud',
        unitPrice: 1000,
        quantity: 1,
      },
      {
        programId: 'pixelcraft-studio',
        programName: 'PixelCraft Studio',
        thaiName: 'แต่งภาพ',
        licenseType: 'monthly_cloud',
        unitPrice: 1000,
        quantity: 1,
      },
    ],
    'launch20'
  );

  assert.equal(summary.subtotal, 2000);
  assert.equal(summary.bundleDiscount, 200); // 10% of 2000
  assert.equal(summary.promoDiscount, 360); // 20% of 1800
  assert.equal(summary.appliedPromoCode, 'LAUNCH20');
  assert.equal(summary.vatAmount, 101); // 7% of 1440 rounded
  assert.equal(summary.grandTotal, 1541);
});

test('calculateSubscriptionBilling computes annual savings accurately', () => {
  const proPlan = SUBSCRIPTION_PLANS.find((p) => p.id === 'pro')!;
  const annual = calculateSubscriptionBilling(proPlan, 'annual');

  assert.equal(annual.effectiveMonthly, 1190);
  assert.equal(annual.totalBilled, 14280);
  assert.equal(annual.annualSavings, 3600);
});

test('filterPrograms filters by category and Thai/English search query', () => {
  const erpOnly = filterPrograms(SOFTWARE_PROGRAMS, 'erp', '');
  assert.equal(erpOnly.length, 2);

  const searchTax = filterPrograms(SOFTWARE_PROGRAMS, 'all', 'ใบกำกับภาษี');
  assert.equal(searchTax.length, 1);
  assert.equal(searchTax[0].id, 'docuflow-tax');
});

test('calculateTaxInvoice computes VAT 7% and 3% withholding tax accurately', () => {
  const result = calculateTaxInvoice(10000, true, 3);
  assert.equal(result.baseAmount, 10000);
  assert.equal(result.vatAmount, 700);
  assert.equal(result.totalWithVat, 10700);
  assert.equal(result.withholdingAmount, 300);
  assert.equal(result.netPayable, 10400);
});
