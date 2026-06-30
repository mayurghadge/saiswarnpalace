import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useGoldRate } from '../contexts/GoldRateContext';
import { CreditCard, ArrowLeft, X, CheckCircle2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { calculateDiscountFromCoupon, loadAppliedCoupon, saveAppliedCoupon } from '../utils/coupons';

const Checkout = () => {
  const { cart, cartTotal } = useCart();
  const { gstRate } = useGoldRate();
  const navigate = useNavigate();

  // Demo cart data
  const demoCart = [
    { id: 1, name: 'Elegant Casting 22K Gold Floral Pendant', sku: '106T02SA23445T0916001Z2700', price: 21413.96, discount_price: 21413.96, quantity: 1, image: 'https://res.cloudinary.com/dayhebhj7/image/upload/f_auto,q_auto,w_400,h_400,c_fill/v1780553055/IMG-20230905-WA0018_khsrzn.jpg' },
    { id: 2, name: 'Traditional Bridal 22K Gold Short Necklace', sku: '2810T04SB7070426249600', price: 509972.60, discount_price: 509972.60, quantity: 1, image: 'https://res.cloudinary.com/dayhebhj7/image/upload/f_auto,q_auto,w_400,h_400,c_fill/v1780295778/chain_nxgghq.jpg' },
    { id: 3, name: 'Classic Elegance 22K Gold Colorful Nose Pin', sku: '105T02SA23906T097096005N00', price: 1586.33, discount_price: 1586.33, quantity: 1, image: 'https://res.cloudinary.com/dayhebhj7/image/fetch/f_auto,q_auto,w_400,h_400,c_fill/https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f' },
  ];

  const displayCart = cart.length > 0 ? cart : demoCart;
  const subtotal = displayCart.reduce((sum, item) => sum + ((item.discount_price || item.price) * item.quantity), 0);
  const tax = (subtotal * gstRate) / 100;
  const shipping = 0;
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(() => loadAppliedCoupon());
  const [discountAmount, setDiscountAmount] = useState(0);
  
  const total = subtotal + tax + shipping - discountAmount;

  const [step, setStep] = useState('shipping'); // 'shipping' or 'payment'
  const [form, setForm] = useState({
    name: 'ghadge mayur',
    phone: '6304399806',
    email: '',
    address: 'market streetmnbvcxwefg',
    city: 'narasannapeta',
    state: 'Andhra Pradesh',
    pincode: '532421',
    paymentMethod: 'razorpay',
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
        navigate('/payment-success');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 'shipping') {
      setStep('payment');
    } else {
      handleRazorpayPayment();
    }
  };

  return (
    <div className="py-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'shipping' ? 'bg-[#9D7E2A] text-white' : 'bg-white text-[#9D7E2A] border-2 border-[#9D7E2A]'}`}>
                {step === 'payment' ? <CheckCircle2 size={16} /> : <span className="text-sm">1</span>}
              </div>
              <span className={`font-medium ${step === 'shipping' ? 'text-[#9D7E2A]' : 'text-gray-800'}`}>Shipping</span>
            </div>
            <div className={`w-16 h-0.5 ${step === 'payment' ? 'bg-[#9D7E2A]' : 'bg-gray-300'}`} />
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
                      <img src="https://razorpay.com/favicon.ico" alt="Razorpay" className="w-4 h-4" />
                      <span className="text-sm">Razorpay</span>
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
                    onClick={handleRazorpayPayment}
                    className="px-8 py-2 bg-[#9D7E2A] text-white rounded-full hover:bg-yellow-700 transition font-medium"
                  >
                    PAY WITH RAZORPAY
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
