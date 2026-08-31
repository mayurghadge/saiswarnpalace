import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { calculateProductPrice } from '../utils/pricing';

const GoldRateContext = createContext();
const API_BASE =
  import.meta.env.VITE_API_URL || '/api';
const RATE_REFRESH_INTERVAL_MS = 60_000;

export const GoldRateProvider = ({ children }) => {
  // Gold rate per gram (INR)
  const [goldRate18k, setGoldRate18k] = useState(11680); // 18K gold per gram
  const [goldRate22k, setGoldRate22k] = useState(14275); // 22k gold per gram
  const [goldRate24k, setGoldRate24k] = useState(15574); // 24k gold per gram
  const [silverRate, setSilverRate] = useState(266); // Silver rate per gram
  const [gstRate, setGstRate] = useState(3); // GST percentage

  const refreshRates = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/gold-rates`, { cache: 'no-store' });
      if (!response.ok) return false;

      const data = await response.json();
      const rates = data.rates || {};

      if (rates.gold_rate_18k != null) setGoldRate18k(Number(rates.gold_rate_18k) || 0);
      if (rates.gold_rate_22k != null) setGoldRate22k(Number(rates.gold_rate_22k) || 0);
      if (rates.gold_rate_24k != null) setGoldRate24k(Number(rates.gold_rate_24k) || 0);
      if (rates.silver_rate != null) setSilverRate(Number(rates.silver_rate) || 0);
      if (rates.gst_rate != null) setGstRate(Number(rates.gst_rate) || 0);
      return true;
    } catch (error) {
      console.error('Failed to load rates:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    refreshRates();

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshRates();
    };

    const refreshFromAnotherTab = (event) => {
      if (event.key === 'saiswarnpalace:gold-rates-updated') refreshRates();
    };

    const refreshTimer = setInterval(refreshRates, RATE_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshRates);
    window.addEventListener('storage', refreshFromAnotherTab);

    return () => {
      clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshRates);
      window.removeEventListener('storage', refreshFromAnotherTab);
    };
  }, [refreshRates]);

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
    const { metal, rate, label } = getRateForPurity(product.purity);

    return {
      ...calculateProductPrice(product, rate, gstRate),
      metal,
      purityLabel: label,
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
      refreshRates,
      calculateGoldPrice,
      getRateForPurity,
      calculateProductEstimate
    }}>
      {children}
    </GoldRateContext.Provider>
  );
};

export const useGoldRate = () => useContext(GoldRateContext);
