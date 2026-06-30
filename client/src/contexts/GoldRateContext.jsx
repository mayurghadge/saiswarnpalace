import { createContext, useContext, useEffect, useState } from 'react';

const GoldRateContext = createContext();
const API_BASE = 'http://localhost:5000/api';

export const GoldRateProvider = ({ children }) => {
  // Gold rate per gram (INR)
  const [goldRate18k, setGoldRate18k] = useState(11680); // 18K gold per gram
  const [goldRate22k, setGoldRate22k] = useState(14275); // 22k gold per gram
  const [goldRate24k, setGoldRate24k] = useState(15574); // 24k gold per gram
  const [silverRate, setSilverRate] = useState(266); // Silver rate per gram
  const [gstRate, setGstRate] = useState(3); // GST percentage

  useEffect(() => {
    const loadRates = async () => {
      try {
        const response = await fetch(`${API_BASE}/gold-rates`);
        if (!response.ok) return;
        const data = await response.json();
        const rates = data.rates || {};

        if (rates.gold_rate_18k != null) setGoldRate18k(Number(rates.gold_rate_18k) || 0);
        if (rates.gold_rate_22k != null) setGoldRate22k(Number(rates.gold_rate_22k) || 0);
        if (rates.gold_rate_24k != null) setGoldRate24k(Number(rates.gold_rate_24k) || 0);
        if (rates.silver_rate != null) setSilverRate(Number(rates.silver_rate) || 0);
        if (rates.gst_rate != null) setGstRate(Number(rates.gst_rate) || 0);
      } catch (error) {
        console.error('Failed to load rates:', error);
      }
    };

    loadRates();
  }, []);

  const normalizePurity = (purity = '22k') => String(purity).trim().toUpperCase();

  const getRateForPurity = (purity = '22k') => {
    const normalizedPurity = normalizePurity(purity);

    if (normalizedPurity === '24K') return { metal: 'gold', rate: goldRate24k, label: '24K Gold' };
    if (normalizedPurity === '22K') return { metal: 'gold', rate: goldRate22k, label: '22K Gold' };
    if (normalizedPurity === '18K') return { metal: 'gold', rate: goldRate18k, label: '18K Gold' };
    if (
      normalizedPurity === '999' ||
      normalizedPurity === '999 SILVER' ||
      normalizedPurity === 'PURE SILVER' ||
      normalizedPurity === '925' ||
      normalizedPurity === 'SILVER'
    ) {
      return {
        metal: 'silver',
        rate: silverRate,
        label: normalizedPurity === '925' ? '925 Silver' : 'Pure Silver'
      };
    }

    return { metal: 'gold', rate: goldRate22k, label: '22K Gold' };
  };

  const calculateProductEstimate = (product = {}) => {
    const weight = Number(product.weight || 0);
    const makingChargePerGram = Number(product.making_charges || 0);
    const fixedMakingCharge = Number(product.fixed_making_charge || 0);
    const diamondPrice = Number(product.diamond_price || 0);
    const wastagePercentage = Number(product.wastage_percentage ?? 0);
    const { metal, rate, label } = getRateForPurity(product.purity);

    const metalValue = rate * weight;
    const wastageAmount = (metalValue * wastagePercentage) / 100;
    const makingChargesAmount = makingChargePerGram * weight + fixedMakingCharge;
    const subtotal = metalValue + wastageAmount + makingChargesAmount + diamondPrice;
    const gstAmount = (subtotal * gstRate) / 100;
    const estimatedTotal = subtotal + gstAmount;

    return {
      metal,
      purityLabel: label,
      rate,
      weight,
      metalValue,
      wastagePercentage,
      wastageAmount,
      makingChargePerGram,
      fixedMakingCharge,
      makingChargesAmount,
      diamondPrice,
      subtotal,
      gstRate,
      gstAmount,
      estimatedTotal
    };
  };

  // Calculate gold price based on purity, weight, making charges, and wastage
  const calculateGoldPrice = (weightInGrams, purity = '22k', makingCharges = 500, wastagePercentage = null) => {
    let rate = 0;
    if (purity === '24k') rate = goldRate24k;
    else if (purity === '22k') rate = goldRate22k;
    else if (purity === '18k') rate = goldRate18k;
    
    const wastage = wastagePercentage !== null ? wastagePercentage : 0;
    
    // Calculate gold value + wastage
    const goldValue = rate * weightInGrams;
    const wastageAmount = (goldValue * wastage) / 100;
    const totalGoldCost = goldValue + wastageAmount;
    
    const totalBeforeGst = totalGoldCost + makingCharges;
    const gstAmount = (totalBeforeGst * gstRate) / 100;
    const totalPrice = totalBeforeGst + gstAmount;
    
    return {
      goldValue,
      wastageAmount,
      wastagePercentage: wastage,
      makingCharges,
      totalBeforeGst,
      gstAmount,
      totalPrice
    };
  };

  return (
    <GoldRateContext.Provider value={{
      goldRate18k,
      setGoldRate18k,
      goldRate22k,
      setGoldRate22k,
      goldRate24k,
      setGoldRate24k,
      silverRate,
      setSilverRate,
      gstRate,
      setGstRate,
      calculateGoldPrice,
      getRateForPurity,
      calculateProductEstimate
    }}>
      {children}
    </GoldRateContext.Provider>
  );
};

export const useGoldRate = () => useContext(GoldRateContext);
