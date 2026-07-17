import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useGoldRate } from '../contexts/GoldRateContext';
import { CreditCard, ArrowLeft, X, CheckCircle2, Check, Banknote, WalletCards } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { calculateDiscountFromCoupon, loadAppliedCoupon, saveAppliedCoupon } from '../utils/coupons';

const Checkout = () => {
  const { cart, cartTotal } = useCart();
  const { gstRate } = useGoldRate();
  const navigate = useNavigate();

  const displayCart = cart;
  const subtotal = displayCart.reduce((sum, item) => sum + ((item.discount_price || item.price) * item.quantity), 0);
  const tax = (subtotal * gstRate) / 100;
  const shipping = 0;
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(() => loadAppliedCoupon());
  const [discountAmount, setDiscountAmount] = useState(0);
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  
  const total = subtotal + tax + shipping - discountAmount;

  const [step, setStep] = useState('shipping'); // 'shipping' or 'payment'
  const [form, setForm] = useState({
    name: 'na',
    phone: 'NA',
    email: 'NA',
    address: 'NA',
    city: 'NA',
    state: 'NA',
    pincode: 'NA',
    paymentMethod: 'NA',
    billingSameAsShipping: true
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    if (!appliedCoupon) {
      setDiscountAmount(0);
      return;
    }

    setDiscountAmount(calculateDiscountFromCoupon(appliedCoupon, subtotal + tax + shipping));
  }, [appliedCoupon, subtotal, tax, shipping]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      toast.error('Enter a coupon code');
      return;
    }

    try {
      const response = await api.post('/coupons/apply', {
        code: couponCode.trim().toUpperCase(),
        totalAmount: subtotal + tax + shipping,
      });

      setAppliedCoupon(response.data.coupon);
      saveAppliedCoupon(response.data.coupon);
      setDiscountAmount(Number(response.data.discountAmount) || 0);
      toast.success('Coupon applied!');
    } catch (error) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      saveAppliedCoupon(null);
      toast.error(error.response?.data?.message || 'Failed to apply coupon');
    }
  };

  const handleRazorpayPayment = () => {
    if (!window.Razorpay) {
      toast.error('Razorpay SDK not loaded');
      return;
    }

    const options = {
      key: 'rzp_test_1DP5mmOlF51298', // Demo key
      amount: total * 100, // Amount in paise
      currency: 'INR',
      name: 'Sai Swarn Palace',
      description: 'Jewellery Purchase',
      handler: function (response) {
        toast.success('Payment successful!');
        completeOrder('Razorpay');
      },
      prefill: {
        name: form.name,
        email: form.email,
        contact: form.phone
      },
      notes: {
        address: form.address
      },
      theme: {
        color: '#9D7E2A'
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const completeOrder = (paymentMethod) => {
    navigate('/payment-success', {
      state: {
        paymentMethod,
        total,
        customerName: form.name,
      },
    });
  };

  const handleCodOrder = () => {
    toast.success('Order placed. Please pay when your order is delivered.');
    completeOrder('Cash on Delivery');
  };

  const handlePaypalPayment = () => {
    if (!paypalClientId) {
      toast.error('PayPal is not configured yet. Add VITE_PAYPAL_CLIENT_ID to enable it.');
      return;
    }

    toast('PayPal checkout integration is ready for configuration.');
  };

  const handlePayment = () => {
    if (form.paymentMethod === 'cod') {
      handleCodOrder();
      return;
    }

    if (form.paymentMethod === 'paypal') {
      handlePaypalPayment();
      return;
    }

    handleRazorpayPayment();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 'shipping') {
      setStep('payment');
    } else {
      handlePayment();
    }
  };

  if (displayCart.length === 0) {
    return (
      <div className="min-h-screen bg-white px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="mt-3 text-gray-600">Add a product before proceeding to payment.</p>
        <Link to="/products" className="mt-6 inline-block rounded-full bg-[#9D7E2A] px-6 py-3 font-medium text-white">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="py-6 md:py-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'shipping' ? 'bg-[#9D7E2A] text-white' : 'bg-white text-[#9D7E2A] border-2 border-[#9D7E2A]'}`}>
                {step === 'payment' ? <CheckCircle2 size={16} /> : <span className="text-sm">1</span>}
              </div>
              <span className={`font-medium ${step === 'shipping' ? 'text-[#9D7E2A]' : 'text-gray-800'}`}>Shipping</span>
            </div>
            <div className={`w-8 sm:w-16 h-0.5 ${step === 'payment' ? 'bg-[#9D7E2A]' : 'bg-gray-300'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'border-2 border-[#9D7E2A] text-[#9D7E2A]' : 'border-2 border-gray-300 text-gray-300'}`}>
                <span className="text-sm">2</span>
              </div>
              <span className={`font-medium ${step === 'payment' ? 'text-[#9D7E2A]' : 'text-gray-500'}`}>Review & Payments</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Shipping & Payment */}
          <div className="md:col-span-2">
            <Link to="/cart" className="text-[#9D7E2A] hover:underline mb-8 inline-block">
              <ArrowLeft size={16} className="inline mr-1" /> Back to Cart
            </Link>

            {step === 'shipping' ? (
              <div className="space-y-8">
                {/* Shipping Address */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
                  <div className="border border-[#9D7E2A] rounded-lg p-4 mb-4">
                    <p className="text-gray-800">{form.name}</p>
                    <p className="text-gray-600">{form.address}</p>
                    <p className="text-gray-600">{form.city}, {form.state} {form.pincode}</p>
                    <p className="text-gray-600">India</p>
                    <p className="text-gray-600">{form.phone}</p>
                  </div>
                  <button className="px-6 py-2 bg-[#9D7E2A] text-white rounded-full hover:bg-yellow-700 transition font-medium text-sm">
                    NEW ADDRESS
                  </button>
                </div>

                {/* Continue Button */}
                <button
                  onClick={() => setStep('payment')}
                  className="px-8 py-2 bg-[#9D7E2A] text-white rounded-full hover:bg-yellow-700 transition font-medium"
                >
                  NEXT
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Payment Method */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
                  
                  <div className="space-y-4 mb-8">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:border-[#9D7E2A]">
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={form.paymentMethod === 'razorpay'}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                        className="w-4 h-4"
                      />
                      <CreditCard size={18} className="text-[#9D7E2A]" />
                      <span className="text-sm">Razorpay</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:border-[#9D7E2A]">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={form.paymentMethod === 'cod'}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                        className="w-4 h-4"
                      />
                      <Banknote size={18} className="text-[#9D7E2A]" />
                      <span className="text-sm">Cash on Delivery</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:border-[#9D7E2A]">
                      <input
                        type="radio"
                        name="payment"
                        value="paypal"
                        checked={form.paymentMethod === 'paypal'}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                        className="w-4 h-4"
                      />
                      <WalletCards size={18} className="text-[#003087]" />
                      <span className="text-sm">PayPal</span>
                    </label>
                  </div>

                  {/* Billing Address */}
                  <div className="mb-8">
                    <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                      <input
                        type="checkbox"
                        checked={form.billingSameAsShipping}
                        onChange={(e) => setForm({ ...form, billingSameAsShipping: e.target.checked })}
                        className="w-4 h-4"
                      />
                      My billing and shipping address are the same
                    </label>

                    {form.billingSameAsShipping && (
                      <div className="pl-6">
                        <p className="text-gray-800">{form.name}</p>
                        <p className="text-gray-600">{form.address}</p>
                        <p className="text-gray-600">{form.city}, {form.state} {form.pincode}</p>
                        <p className="text-gray-600">India</p>
                      </div>
                    )}
                  </div>

                  {/* Pay Button */}
                  <button
                    onClick={handlePayment}
                    className="px-8 py-2 bg-[#9D7E2A] text-white rounded-full hover:bg-yellow-700 transition font-medium"
                  >
                    {form.paymentMethod === 'cod'
                      ? 'PLACE COD ORDER'
                      : form.paymentMethod === 'paypal'
                        ? 'PAY WITH PAYPAL'
                        : 'PAY WITH RAZORPAY'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="md:col-span-1">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">ORDER SUMMARY</h3>
              <p className="text-sm text-gray-600 mb-4">{displayCart.length} items in Cart</p>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {displayCart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                    </div>
                    <p className="text-sm font-medium text-[#9D7E2A]">
                      ₹{((item.discount_price || item.price) * (item.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Cart Subtotal:</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping:</span>
                  <span className="text-green-600">Free Shipping</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax:</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Coupon Discount:</span>
                    <span>-₹{Math.round(discountAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-3 mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span className="text-[#9D7E2A]">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Coupon */}
              {appliedCoupon && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-800 mb-1">{appliedCoupon.code}</p>
                  <p className="text-xs text-gray-500 mb-1">
                    {appliedCoupon.discount_type === 'PERCENTAGE'
                      ? `${appliedCoupon.discount_value}% off applied`
                      : `₹${appliedCoupon.discount_value} off applied`}
                  </p>
                  {appliedCoupon.max_discount ? <p className="text-xs text-gray-400">Max discount: ₹{appliedCoupon.max_discount}</p> : null}
                </div>
              )}

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter discount code" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm"
                >
                  Apply Discount
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
