import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { downloadInvoicePdf } from '../utils/invoice';

const Orders = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my');
      // Transform snake_case to PascalCase for orders list
      const transformedOrders = res.data.map(order => ({
        Id: order.id,
        OrderNumber: order.order_number,
        TotalAmount: order.total,
        Status: order.order_status,
        CreatedAt: order.created_at,
        CustomerName: order.CustomerName,
        CustomerPhone: order.CustomerPhone,
        CustomerEmail: order.CustomerEmail,
        ShippingAddress: order.ShippingAddress,
        ShippingCity: order.ShippingCity,
        ShippingState: order.ShippingState,
        ShippingPincode: order.ShippingPincode,
        PaymentMethod: order.PaymentMethod
      }));
      setOrders(transformedOrders);
    } catch (err) {
      toast.error('Failed to fetch orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single order if id exists
  useEffect(() => {
    if (id) {
      const fetchOrderById = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/orders/${id}`);
          // Transform snake_case to PascalCase for single order
          const transformedOrder = {
            Id: res.data.order.id,
            OrderNumber: res.data.order.order_number,
            TotalAmount: res.data.order.total,
            Status: res.data.order.order_status,
            CreatedAt: res.data.order.created_at,
            CustomerName: res.data.order.CustomerName,
            CustomerPhone: res.data.order.CustomerPhone,
            CustomerEmail: res.data.order.CustomerEmail,
            ShippingAddress: res.data.order.ShippingAddress,
            ShippingCity: res.data.order.ShippingCity,
            ShippingState: res.data.order.ShippingState,
            ShippingPincode: res.data.order.ShippingPincode,
            PaymentMethod: res.data.order.PaymentMethod
          };
          // Transform order items too
          const transformedItems = res.data.items.map(item => ({
            Id: item.Id || item.id,
            ProductId: item.ProductId || item.productId,
            Quantity: item.Quantity || item.quantity,
            PriceAtTime: item.PriceAtTime || item.priceAtTime,
            product_name: item.product_name,
            product_image: item.product_image
          }));
          setSelectedOrder(transformedOrder);
          setOrderItems(transformedItems);
        } catch (err) {
          toast.error('Failed to fetch order');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrderById();
    } else {
      fetchOrders();
    }
  }, [id]);

  const handleDownloadInvoice = (order) => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.PriceAtTime * item.Quantity), 0);
    const tax = order.TotalAmount - subtotal;
    downloadInvoicePdf({
      orderNumber: order.OrderNumber,
      date: new Date(order.CreatedAt).toLocaleDateString(),
      customerName: order.CustomerName,
      shippingAddress: {
        name: order.CustomerName,
        phone: order.CustomerPhone,
        address: order.ShippingAddress,
        city: order.ShippingCity,
        state: order.ShippingState,
        pincode: order.ShippingPincode
      },
      paymentMethod: order.PaymentMethod || 'Not specified',
      items: orderItems.map(item => ({
        id: item.ProductId,
        name: item.product_name || 'Product',
        image: item.product_image || '',
        sku: '',
        weight: 0,
        price: item.PriceAtTime,
        quantity: item.Quantity
      })),
      subtotal,
      tax,
      total: order.TotalAmount
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // If viewing single order
  if (id) {
    if (!selectedOrder) {
      return (
        <div className="py-12 bg-white min-h-screen">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
            <Link to="/orders" className="mt-4 inline-block text-[#9D7E2A] hover:underline">Back to My Orders</Link>
          </div>
        </div>
      );
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.PriceAtTime * item.Quantity), 0);
    const tax = selectedOrder.TotalAmount - subtotal;

    return (
      <div className="py-12 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-3">
              <nav className="space-y-1">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 px-0 py-2 text-left transition text-gray-600 hover:text-gray-900"
                >
                  My Account
                </button>
                <button
                  className="w-full flex items-center gap-3 px-0 py-2 text-left transition text-[#9D7E2A] font-medium"
                >
                  <CheckCircle2 size={16} />
                  My Orders
                </button>
                <button
                  onClick={() => navigate('/wishlist')}
                  className="w-full flex items-center gap-3 px-0 py-2 text-left transition text-gray-600 hover:text-gray-900"
                >
                  My Wish List
                </button>
                <button
                  onClick={() => navigate('/profile?tab=address')}
                  className="w-full flex items-center gap-3 px-0 py-2 text-left transition text-gray-600 hover:text-gray-900"
                >
                  Address Book
                </button>
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
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="flex items-center gap-2 rounded-full bg-[#9D7E2A] px-5 py-2 text-white transition hover:bg-yellow-700"
                >
                  <Download size={16} />
                  Download Invoice
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column - Shipping & Payment */}
                <div className="md:col-span-2">
                  {/* Shipping Address */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
                    <div className="border border-[#9D7E2A] rounded p-4">
                      <p className="text-gray-800 font-semibold">{selectedOrder.CustomerName}</p>
                      <p className="text-gray-600">{selectedOrder.ShippingAddress}</p>
                      <p className="text-gray-600">{selectedOrder.ShippingCity}, {selectedOrder.ShippingState} {selectedOrder.ShippingPincode}</p>
                      <p className="text-gray-600">India</p>
                      <p className="text-gray-600">{selectedOrder.CustomerPhone}</p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-[#9D7E2A] bg-[#9D7E2A]" />
                        <span className="text-gray-700">{selectedOrder.PaymentMethod || 'Not specified'}</span>
                      </div>
                      <div className="ml-6">
                        <p className="text-gray-800 font-semibold">{selectedOrder.CustomerName}</p>
                        <p className="text-gray-600">{selectedOrder.ShippingAddress}</p>
                        <p className="text-gray-600">{selectedOrder.ShippingCity}, {selectedOrder.ShippingState} {selectedOrder.ShippingPincode}</p>
                        <p className="text-gray-600">India</p>
                        <p className="text-gray-600">{selectedOrder.CustomerPhone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Order Summary */}
                <div className="md:col-span-1">
                  <div className="border border-gray-200 rounded p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                    <p className="text-sm text-gray-600 mb-4">{orderItems.length} items in Order</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Shipping:</span>
                        <span className="text-green-600">Free Shipping</span>
                      </div>
                      {tax > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Tax:</span>
                          <span>₹{tax.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 pt-3 mb-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Grand Total:</span>
                        <span className="text-[#9D7E2A]">₹{selectedOrder.TotalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="mb-4 text-lg font-medium text-gray-900">Ordered Items</h3>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {orderItems.map((item) => (
                    <div key={item.Id} className="flex items-center gap-4 border-b border-gray-100 p-4 last:border-b-0">
                      <img 
                        src={item.product_image || 'https://via.placeholder.com/80'} 
                        alt={item.product_name || 'Product'} 
                        className="h-20 w-20 rounded-lg object-cover" 
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.product_name || 'Product'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Qty: {item.Quantity}</p>
                        <p className="font-semibold text-[#9D7E2A]">₹{Math.round(item.PriceAtTime * item.Quantity).toLocaleString()}</p>
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
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center gap-3 px-0 py-2 text-left transition text-gray-600 hover:text-gray-900"
              >
                My Account
              </button>
              <button
                className="w-full flex items-center gap-3 px-0 py-2 text-left transition text-[#9D7E2A] font-medium"
              >
                <CheckCircle2 size={16} />
                My Orders
              </button>
              <button
                onClick={() => navigate('/wishlist')}
                className="w-full flex items-center gap-3 px-0 py-2 text-left transition text-gray-600 hover:text-gray-900"
              >
                My Wish List
              </button>
              <button
                onClick={() => navigate('/profile?tab=address')}
                className="w-full flex items-center gap-3 px-0 py-2 text-left transition text-gray-600 hover:text-gray-900"
              >
                Address Book
              </button>
            </nav>
          </div>

          {/* Orders List */}
          <div className="md:col-span-9">
            <div className="mb-8">
              <Link to="/profile" className="text-[#9D7E2A] hover:underline">
                ← Back to My Account
              </Link>
            </div>

            <div className="border border-gray-200 rounded overflow-x-auto">
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
                    <tr key={order.Id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-800">{order.OrderNumber}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">{new Date(order.CreatedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">{order.ShippingCity}, {order.ShippingState}</td>
                      <td className="px-4 py-4 text-sm text-gray-800 text-right">
                        <span className="text-[#9D7E2A] font-medium">₹{order.TotalAmount.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {order.Status || 'Processing'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link to={`/orders/${order.Id}`} className="text-[#9D7E2A] hover:underline text-sm">
                          View Order
                        </Link>
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
