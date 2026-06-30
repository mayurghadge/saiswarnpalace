import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useGoldRate } from '../contexts/GoldRateContext';
import { Plus, Minus, Heart, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { calculateDiscountFromCoupon, loadAppliedCoupon, saveAppliedCoupon } from '../utils/coupons';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { gstRate } = useGoldRate();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(() => loadAppliedCoupon());

  const displayCart = cart;
  const getItemUnitPrice = (item) => Number(item.discount_price ?? item.price ?? 0);
  const subtotal = cart.reduce((sum, item) => sum + (getItemUnitPrice(item) * item.quantity), 0);
  const tax = (subtotal * gstRate) / 100;
  const discountAmount = calculateDiscountFromCoupon(appliedCoupon, subtotal + tax);
  const total = subtotal + tax - discountAmount;

  useEffect(() => {
    if (!appliedCoupon) return;
    saveAppliedCoupon(appliedCoupon);
  }, [appliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Enter a coupon code');
      return;
    }

    try {
      const response = await api.post('/coupons/apply', {
        code: couponCode.trim().toUpperCase(),
        totalAmount: subtotal + tax,
      });
      setAppliedCoupon(response.data.coupon);
      saveAppliedCoupon(response.data.coupon);
      toast.success('Coupon applied!');
    } catch (error) {
      setAppliedCoupon(null);
      saveAppliedCoupon(null);
      toast.error(error.response?.data?.message || 'Failed to apply coupon');
    }
  };

  return (
    <div className="py-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items yet!</p>
            <Link 
              to="/" 
              className="inline-block px-10 py-3 bg-[#9D7E2A] text-white rounded-full hover:bg-yellow-700 transition font-medium text-lg"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Items Column */}
            <div className="md:col-span-2">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-px bg-[#9D7E2A] w-16" />
                  <h3 className="text-xl font-bold text-[#9D7E2A]" style={{ fontFamily: 'Georgia, serif' }}>ITEMS ORDERED</h3>
                  <div className="h-px bg-[#9D7E2A] w-16" />
                </div>
              </div>

              <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 bg-gray-50 p-4 border-b border-gray-200">
                  <div className="md:col-span-5" />
                  <div className="md:col-span-3 text-sm font-medium text-gray-600">DETAILS</div>
                  <div className="md:col-span-1 text-sm font-medium text-gray-600">PRICE</div>
                  <div className="md:col-span-1 text-sm font-medium text-gray-600">QTY</div>
                  <div className="md:col-span-2 text-sm font-medium text-gray-600 text-right">TOTAL</div>
                </div>

                {/* Cart Items */}
                {displayCart.map((item) => (
                  <div key={item.id} className="border-b border-gray-100 p-4">
                    <div className="grid md:grid-cols-12 gap-4 items-center">
                      {/* Image & Name */}
                      <div className="md:col-span-5 flex items-center gap-4">
                        <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded" />
                        <div>
                          <Link to={`/products/${item.id}`} className="text-gray-800 hover:text-[#9D7E2A] transition font-medium">
                            {item.name}
                          </Link>
                          <p className="text-sm text-gray-500">{item.item_code || item.sku || 'Code not added'}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-700">
                              Purity: {item.purity_label || item.purity || 'N/A'}
                            </span>
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                              Weight: {Number(item.weight || 0).toFixed(2)}g
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                              Rate: ₹{Math.round(item.rate_per_gram || 0).toLocaleString()}/g
                            </span>
                            <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">
                              HUID: {item.huid_hallmark || 'N/A'}
                            </span>
                          </div>
                          
                          <div className="mt-2">
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                              <button className="flex items-center gap-1 hover:text-[#9D7E2A] transition">
                                <Heart size={14} /> Move to Wishlist
                              </button>
                              <span className="text-gray-400">|</span>
                              <button 
                                onClick={() => {
                                  removeFromCart(item.id);
                                  toast.success('Item removed!');
                                }}
                                className="flex items-center gap-1 hover:text-red-600 transition"
                              >
                                <X size={14} /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details (desktop only) */}
                      <div className="hidden md:block md:col-span-3 text-sm text-gray-600 space-y-1">
                        <p>Code: {item.item_code || item.sku || 'N/A'}</p>
                        <p>HUID: {item.huid_hallmark || 'N/A'}</p>
                        <p>{item.purity_label || item.purity || 'N/A'} | {Number(item.weight || 0).toFixed(2)}g</p>
                        <p>Rate: ₹{Math.round(item.rate_per_gram || 0).toLocaleString()}/g</p>
                      </div>

                      {/* Price */}
                      <div className="md:col-span-1 text-sm text-gray-800">
                        ₹{Math.round(getItemUnitPrice(item)).toLocaleString()}
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-1">
                        <div className="flex items-center gap-2 border border-gray-300 rounded-full overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity || 1}</span>
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="md:col-span-2 text-right text-sm font-medium text-[#9D7E2A]">
                        ₹{Math.round(getItemUnitPrice(item) * (item.quantity || 1)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link to="/" className="px-8 py-2 bg-[#9D7E2A] text-white rounded-full hover:bg-yellow-700 transition font-medium">
                  CONTINUE SHOPPING
                </Link>
                <button 
                  onClick={() => {
                    clearCart();
                    toast.success('Cart cleared!');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-100 transition font-medium text-sm"
                >
                  CLEAR SHOPPING CART
                </button>
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="md:col-span-1">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ORDER SUMMARY</h3>
                
                {/* Coupon */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-600 mb-2">ENTER VOUCHER CODE</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter discount code" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    <button onClick={handleApplyCoupon} className="px-4 py-2 bg-[#9D7E2A] text-white rounded hover:bg-yellow-700 transition font-medium text-sm">
                      APPLY
                    </button>
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal:</span>
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

                {/* Grand Total */}
                <div className="border-t border-gray-200 pt-3 mb-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>GRAND TOTAL</span>
                    <span className="text-[#9D7E2A]">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link 
                  to="/checkout"
                  className="w-full block text-center py-3 bg-[#9D7E2A] text-white rounded-full hover:bg-yellow-700 transition font-semibold"
                >
                  PROCEED TO CHECKOUT
                </Link>

                <p className="text-right text-sm text-gray-500 mt-2">
                  Check Out with Multiple Addresses
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
