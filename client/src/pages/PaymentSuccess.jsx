import { Link } from 'react-router-dom';
import { CheckCircle, Download, ShoppingBag } from 'lucide-react';
import { downloadInvoicePdf } from '../utils/invoice';

const PaymentSuccess = () => {
  const orderSummary = {
    orderNumber: 'ORD12345',
    date: new Date().toLocaleDateString(),
    customerName: 'Sai Swarn Palace Customer',
    shippingAddress: {
      name: 'Sai Swarn Palace Customer',
      address: 'Shipping address added during checkout',
      city: 'Narasannapeta',
      state: 'Andhra Pradesh',
      pincode: '532421',
      phone: '6304399806'
    },
    paymentMethod: 'Razorpay',
    items: [
      { name: 'Jewellery Order Item', quantity: 1, price: 138020 }
    ],
    subtotal: 134000,
    tax: 4020,
    total: 138020,
  };

  return (
    <div className="py-20 bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
        <CheckCircle size={80} className="mx-auto text-green-500 mb-6" />
        <h1 className="text-4xl font-bold mb-4">Order Placed Successfully!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Thank you for your purchase. We'll send you a confirmation email shortly.
        </p>
        
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Order Number</span>
            <span className="font-semibold text-lg">#ORD12345</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Date</span>
            <span className="font-medium">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-gray-600">Total Amount</span>
            <span className="text-2xl font-bold text-gold">₹1,38,020</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            to="/orders"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:border-gold hover:text-gold transition"
          >
            <ShoppingBag size={20} />
            View Orders
          </Link>
          <button onClick={() => downloadInvoicePdf(orderSummary)} className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            <Download size={20} />
            Download Invoice
          </button>
        </div>

        <Link
          to="/products"
          className="inline-block px-8 py-4 bg-gold text-black font-semibold rounded-xl hover:bg-gold-light transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;
