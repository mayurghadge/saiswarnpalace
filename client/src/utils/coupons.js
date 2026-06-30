export const APPLIED_COUPON_STORAGE_KEY = 'appliedCoupon';

export const calculateDiscountFromCoupon = (coupon, totalAmount) => {
  if (!coupon) return 0;

  const amount = Number(totalAmount || 0);
  const minOrderValue = Number(coupon.min_order_value || 0);
  if (minOrderValue > 0 && amount < minOrderValue) return 0;

  let discountAmount = 0;
  if (coupon.discount_type === 'FIXED') {
    discountAmount = Number(coupon.discount_value || 0);
  } else if (coupon.discount_type === 'PERCENTAGE') {
    discountAmount = (amount * Number(coupon.discount_value || 0)) / 100;
    const maxDiscount = Number(coupon.max_discount || 0);
    if (maxDiscount > 0 && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }
  }

  return Math.max(0, Math.min(discountAmount, amount));
};

export const saveAppliedCoupon = (coupon) => {
  if (!coupon) {
    localStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
    return;
  }
  localStorage.setItem(APPLIED_COUPON_STORAGE_KEY, JSON.stringify(coupon));
};

export const loadAppliedCoupon = () => {
  try {
    const raw = localStorage.getItem(APPLIED_COUPON_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};