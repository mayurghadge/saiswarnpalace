import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download } from 'lucide-react';
import { downloadInvoicePdf } from '../utils/invoice';

const Orders = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Orders will be populated from the customer order API when checkout is connected.
  const orders = [];

  // If viewing single order
  if (id) {
    const order = orders.find(o => o.id === id);

    if (!order) {
      return (
        <div className="py-12 bg-white min-h-screen">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
            <Link to="/orders" className="mt-4 inline-block text-[#9D7E2A] hover:underline">Back to My Orders</Link>
          </div>
        </div>
      );
    }

    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = order.total - subtotal;

    const handleDownloadInvoice = () => {
      downloadInvoicePdf({
        orderNumber: order.id,
        date: order.date,
        customerName: order.shippingAddress.name,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod || 'Razorpay',
        items: order.items,
        subtotal,
        tax,
        total: order.total,
      });
    };

    return (
      <div className="py-12 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-3">
              <nav className="space-y-1">
                {[
                  { id: 'account', label: 'My Account' },
                  { id: 'orders', label: 'My Orders', active: true },
                  { id: 'wishlist', label: 'My Wish List' },
                  { id: 'address', label: 'Address Book' },
                  { id: 'account-info', label: 'Account Information' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => item.id === 'orders' ? null : item.id === 'account' ? navigate('/profile') : null}
                    className={`w-full flex items-center gap-3 px-0 py-2 text-left transition ${
                      item.active ? 'text-[#9D7E2A] font-medium' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.active && <CheckCircle2 size={16} />}
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="md:col-span-9">
              <div className="mb-8">
                <Link to="/orders" className="text-[#9D7E2A] hover:underline">
                  ← Back to My Orders
                </Link>
              </div>

              <div className="mb-6 flex justify-end">
                <button
                  onClick={handleDownloadInvoice}
                  className="flex items-center gap-2 rounded-full bg-[#9D7E2A] px-5 py-2 text-white transition hover:bg-yellow-700"
                >
                  <Download size={16} />
                  Download Invoice
                </button>
              </div>

              {/* Order Details Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#9D7E2A] flex items-center justify-center text-white">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-[#9D7E2A] font-medium">Shipping</span>
                  </div>
                  <div className="w-16 h-0.5 bg-[#9D7E2A]" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-[#9D7E2A] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#9D7E2A]" />
                    </div>
                    <span className="text-gray-600">Review & Payments</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column - Shipping & Payment */}
                <div className="md:col-span-2">
                  {/* Shipping Address */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
                    <div className="border border-[#9D7E2A] rounded p-4">
                      <p className="text-gray-800">{order.shippingAddress.name}</p>
                      <p className="text-gray-600">{order.shippingAddress.address}</p>
                      <p className="text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                      <p className="text-gray-600">India</p>
                      <p className="text-gray-600">{order.shippingAddress.phone}</p>
                    </div>
                    <button className="mt-4 px-6 py-2 bg-[#9D7E2A] text-white rounded-full hover:bg-yellow-700 transition font-medium text-sm">
                      NEW ADDRESS
                    </button>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        <span className="text-gray-700">Razorpay</span>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <input type="checkbox" id="billing-same" className="w-4 h-4 text-[#9D7E2A]" checked />
                        <label htmlFor="billing-same" className="text-sm text-gray-600">My billing and shipping address are the same</label>
                      </div>
                      <div className="ml-6">
                        <p className="text-gray-800">{order.shippingAddress.name}</p>
                        <p className="text-gray-600">{order.shippingAddress.address}</p>
                        <p className="text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                        <p className="text-gray-600">India</p>
                        <p className="text-gray-600">{order.shippingAddress.phone}</p>
                      </div>
                    </div>
                    <button className="mt-6 px-8 py-2 bg-[#9D7E2A] text-white rounded-full hover:bg-yellow-700 transition font-medium">
                      PAY WITH RAZORPAY
                    </button>
                  </div>
                </div>

                {/* Right Column - Order Summary */}
                <div className="md:col-span-1">
                  <div className="border border-gray-200 rounded p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">ORDER SUMMARY</h3>
                    <p className="text-sm text-gray-600 mb-4">{order.items.length} items in Cart</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Cart Subtotal:</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Shipping:</span>
                        <span>Free Shipping</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Tax:</span>
                        <span>₹{tax.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mb-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Grand Total:</span>
                        <span>₹{order.total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-800 mb-1">SAISWARN</p>
                      <p className="text-xs text-gray-500 mb-2">Flat 15% Off on your purchase order</p>
                      <p className="text-xs text-gray-500">*Not applicable to Gold Coins</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Enter discount code" 
                          className="flex-1 border border-gray-300 rounded-full px-3 py-1 text-sm"
                        />
                        <button className="px-4 py-1 bg-gray-900 text-white rounded-full text-sm">
                          Apply Discount
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="mb-4 text-lg font-medium text-gray-900">Ordered Items</h3>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 border-b border-gray-100 p-4 last:border-b-0">
                      <img src={item.image} alt={item.name} className="h-20 w-20 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        <p className="text-sm text-gray-500">Weight: {item.weight}g</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        <p className="font-semibold text-[#9D7E2A]">₹{Math.round(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => navigate('/')}
                  className="px-8 py-2 border-2 border-[#9D7E2A] text-[#9D7E2A] rounded-full hover:bg-[#9D7E2A] hover:text-white transition font-medium"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Orders list
  return (
    <div className="py-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-3">
            <nav className="space-y-1">
              {[
                { id: 'account', label: 'My Account' },
                { id: 'orders', label: 'My Orders', active: true },
                { id: 'wishlist', label: 'My Wish List' },
                { id: 'address', label: 'Address Book' },
                { id: 'account-info', label: 'Account Information' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.id === 'orders' ? null : item.id === 'account' ? navigate('/profile') : null}
                  className={`w-full flex items-center gap-3 px-0 py-2 text-left transition ${
                    item.active ? 'text-[#9D7E2A] font-medium' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.active && <CheckCircle2 size={16} />}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Orders List */}
          <div className="md:col-span-9">
            <div className="mb-8">
              <Link to="/profile" className="text-[#9D7E2A] hover:underline">
                ← Back to My Account
              </Link>
            </div>

            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order #</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ship To</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Order Total</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-gray-500">You have not placed any orders yet.</td>
                    </tr>
                  ) : orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-800">{order.id}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">{order.date}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">{order.shipTo}</td>
                      <td className="px-4 py-4 text-sm text-gray-800 text-right">
                        <span className="text-[#9D7E2A] font-medium">₹{order.total.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-gray-600">{order.status}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link to={`/orders/${order.id}`} className="text-[#9D7E2A] hover:underline text-sm">
                          View Order
                        </Link>
                        <span className="mx-2 text-gray-300">|</span>
                        <button className="text-[#9D7E2A] hover:underline text-sm">
                          Reorder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-600">{orders.length} Item(s)</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-4 px-8 py-2 border-2 border-[#9D7E2A] text-[#9D7E2A] rounded-full hover:bg-[#9D7E2A] hover:text-white transition font-medium"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
