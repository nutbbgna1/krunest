import { SoftwareProgram, SubscriptionPlan } from '../data/programs';

export type LicensePurchaseType = 'monthly_cloud' | 'lifetime_desktop';

export interface CartItem {
  programId: string;
  programName: string;
  thaiName: string;
  licenseType: LicensePurchaseType;
  unitPrice: number;
  quantity: number;
}

export interface CartSummary {
  subtotal: number;
  bundleDiscount: number;
  promoDiscount: number;
  vatAmount: number;
  grandTotal: number;
  appliedPromoCode: string | null;
}

export const VALID_PROMO_CODES: Record<string, { discountRate: number; label: string }> = {
  LAUNCH20: { discountRate: 0.2, label: 'ส่วนลดเปิดตัว 20%' },
  VELOCE10: { discountRate: 0.1, label: 'ส่วนลดสมาชิกใหม่ 10%' },
  BUNDLE15: { discountRate: 0.15, label: 'ส่วนลดแพ็กคู่ 15%' },
};

/**
 * Calculates cart totals including automatic multi-program bundle discount (10% when >= 2 distinct programs),
 * optional promo code discount, and 7% VAT.
 */
export function calculateCartSummary(items: CartItem[], rawPromoCode?: string): CartSummary {
  const subtotal = items.reduce((sum, item) => {
    const qty = Math.max(1, Math.floor(item.quantity));
    return sum + item.unitPrice * qty;
  }, 0);

  // Automatic 10% bundle discount if buying 2 or more distinct programs
  const distinctPrograms = new Set(items.map((i) => i.programId)).size;
  const bundleDiscount = distinctPrograms >= 2 ? Math.round(subtotal * 0.1) : 0;

  const afterBundle = subtotal - bundleDiscount;
  const normalizedCode = (rawPromoCode || '').trim().toUpperCase();
  const promoEntry = normalizedCode ? VALID_PROMO_CODES[normalizedCode] : undefined;

  const promoDiscount = promoEntry ? Math.round(afterBundle * promoEntry.discountRate) : 0;
  const netBeforeVat = Math.max(0, afterBundle - promoDiscount);
  const vatAmount = Math.round(netBeforeVat * 0.07);
  const grandTotal = netBeforeVat + vatAmount;

  return {
    subtotal,
    bundleDiscount,
    promoDiscount,
    vatAmount,
    grandTotal,
    appliedPromoCode: promoEntry ? normalizedCode : null,
  };
}

/**
 * Calculates subscription billing amount based on cadence ('monthly' | 'annual').
 */
export function calculateSubscriptionBilling(
  plan: SubscriptionPlan,
  billingCycle: 'monthly' | 'annual'
): {
  effectiveMonthly: number;
  totalBilled: number;
  annualSavings: number;
} {
  if (billingCycle === 'annual') {
    const effectiveMonthly = plan.annualPricePerMonth;
    const totalBilled = effectiveMonthly * 12;
    const annualSavings = (plan.monthlyPrice - plan.annualPricePerMonth) * 12;
    return { effectiveMonthly, totalBilled, annualSavings };
  }
  return {
    effectiveMonthly: plan.monthlyPrice,
    totalBilled: plan.monthlyPrice,
    annualSavings: 0,
  };
}

/**
 * Filters programs by category and search query.
 */
export function filterPrograms(
  programs: SoftwareProgram[],
  category: string,
  searchQuery: string
): SoftwareProgram[] {
  const q = searchQuery.trim().toLowerCase();
  return programs.filter((prog) => {
    const matchesCategory = category === 'all' || prog.category === category;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      prog.name.toLowerCase().includes(q) ||
      prog.thaiName.toLowerCase().includes(q) ||
      prog.tagline.toLowerCase().includes(q) ||
      prog.categoryLabel.toLowerCase().includes(q)
    );
  });
}

/**
 * Calculates e-Tax invoice and withholding tax totals for the DocuFlow Cloud app.
 */
export function calculateTaxInvoice(
  amountBeforeTax: number,
  includeVat: boolean,
  withholdingRatePercent: number
): {
  baseAmount: number;
  vatAmount: number;
  totalWithVat: number;
  withholdingAmount: number;
  netPayable: number;
} {
  const baseAmount = Math.max(0, Number(amountBeforeTax) || 0);
  const vatAmount = includeVat ? Math.round(baseAmount * 0.07 * 100) / 100 : 0;
  const totalWithVat = Math.round((baseAmount + vatAmount) * 100) / 100;
  const safeWhtRate = Math.max(0, Math.min(15, Number(withholdingRatePercent) || 0));
  const withholdingAmount = Math.round(baseAmount * (safeWhtRate / 100) * 100) / 100;
  const netPayable = Math.round((totalWithVat - withholdingAmount) * 100) / 100;

  return {
    baseAmount,
    vatAmount,
    totalWithVat,
    withholdingAmount,
    netPayable,
  };
}
