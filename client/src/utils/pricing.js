const finiteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const clampPercentage = (value) =>
  Math.min(100, Math.max(0, finiteNumber(value)));

export const calculateProductPrice = (product = {}, rate = 0, gstRate = 0) => {
  const weight = Math.max(0, finiteNumber(product.weight));
  const safeRate = Math.max(0, finiteNumber(rate));
  const makingChargePerGram = Math.max(0, finiteNumber(product.making_charges));
  const fixedMakingCharge = Math.max(0, finiteNumber(product.fixed_making_charge));
  const diamondPrice = Math.max(0, finiteNumber(product.diamond_price));
  const otherCharges = Math.max(0, finiteNumber(product.other_charges));
  const wastagePercentage = clampPercentage(product.wastage_percentage);
  const safeGstRate = clampPercentage(gstRate);

  const metalValue = safeRate * weight;
  const wastageAmount = metalValue * (wastagePercentage / 100);
  const makingChargesAmount = makingChargePerGram * weight + fixedMakingCharge;
  const subtotal = metalValue + wastageAmount + makingChargesAmount + diamondPrice + otherCharges;
  const gstAmount = subtotal * (safeGstRate / 100);

  return {
    weight,
    rate: safeRate,
    metalValue,
    wastagePercentage,
    wastageAmount,
    makingChargePerGram,
    fixedMakingCharge,
    makingChargesAmount,
    diamondPrice,
    otherCharges,
    subtotal,
    discountPercentage: 0,
    discountAmount: 0,
    amountAfterDiscount: subtotal,
    gstRate: safeGstRate,
    gstAmount,
    estimatedTotal: amountAfterDiscount + gstAmount,
  };
};

export const getCartItemUnitPrice = (item = {}) => {
  const price = finiteNumber(item.price);
  return Math.max(0, price);
};
