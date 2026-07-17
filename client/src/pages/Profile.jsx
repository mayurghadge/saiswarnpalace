import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, CheckCircle2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const SERVER_BASE =
  import.meta.env.VITE_SERVER_URL || (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
// Helper to get image URL
const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${SERVER_BASE}/${url}`;
};

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Profile and proofs data
  const [profile, setProfile] = useState(null);
  const [proofs, setProofs] = useState([]);

  // Proof submission form
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [submittingProof, setSubmittingProof] = useState(false);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      setProfile(response.data.user);
      setProofs(response.data.proofs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Demo addresses
  const [addresses, setAddresses] = useState([
    { id: 1, name: 'Ghadge Mayur', phone: '916300399806', address: 'Market streetmnbvcxwef', city: 'narasannapeta', state: 'Andhra Pradesh', pincode: '532421', isDefault: true },
  ]);

  // Demo orders
  const orders = [
    { id: '65-6300221', date: '05/06/2026', total: 547328, status: 'Cancelled', items: 2, shipTo: 'Ghadge Mayur' },
    { id: '65-63002215', date: '05/06/2026', total: 547328, status: 'Cancelled', items: 2, shipTo: 'Ghadge Mayur' },
    { id: '65-63002214', date: '05/06/2026', total: 547328, status: 'Cancelled', items: 2, shipTo: 'Ghadge Mayur' },
    { id: '65-63001652', date: '26/03/2026', total: 44066, status: 'Cancelled', items: 1, shipTo: 'Ghadge Mayur' },
  ];

  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm(addr);
    setShowAddressModal(true);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (editingAddress) {
      setAddresses(addresses.map(addr => 
        addr.id === editingAddress.id ? 
        { ...addressForm, id: editingAddress.id } : 
        (addressForm.isDefault ? { ...addr, isDefault: false } : addr)
      ));
      toast.success('Address updated!');
    } else {
      const newId = Date.now();
      setAddresses([
        ...(addressForm.isDefault ? addresses.map(addr => ({ ...addr, isDefault: false })) : addresses),
        { ...addressForm, id: newId }
      ]);
      toast.success('Address added!');
    }
    setShowAddressModal(false);
    setAddressForm({ name: '', phone: '', address: '', city: '', state: '', pincode: '', isDefault: false });
    setEditingAddress(null);
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    try {
      setSubmittingProof(true);
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('documentNumber', documentNumber);
      if (documentFile) {
        formData.append('verificationDocument', documentFile);
      }
      
      await api.post('/users/submit-verification', formData);
      toast.success('Proof submitted successfully!');
      fetchProfile(); // Refresh profile
      setDocumentType('');
      setDocumentNumber('');
      setDocumentFile(null);
    } catch (err) {
      toast.error('Failed to submit proof');
      console.error(err);
    } finally {
      setSubmittingProof(false);
    }
  };

  const menuItems = [
    { id: 'account', label: 'My Account' },
    { id: 'verification', label: 'ID Verification' },
    { id: 'orders', label: 'My Orders' },
    { id: 'wishlist', label: 'My Wish List' },
    { id: 'address', label: 'Address Book' },
    { id: 'account-info', label: 'Account Information' },
    { id: 'reviews', label: 'My Product Reviews' },
    { id: 'newsletter', label: 'Newsletter Subscriptions' },
  ];

  const handleMenuSelect = (tabId) => {
    if (tabId === 'orders') {
      navigate('/orders');
      return;
    }

    if (tabId === 'wishlist') {
      navigate('/wishlist');
      return;
    }

    setActiveTab(tabId);
  };

  return (
    <div className="py-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-3">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-0 py-2 text-left transition ${
                    activeTab === item.id ? 'text-[#9D7E2A] font-medium' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {activeTab === item.id && <CheckCircle2 size={16} />}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content */}
          <div className="md:col-span-9">
            {activeTab === 'account' && (
              <div className="space-y-8">
                {/* Contact Information */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                    <button className="text-[#9D7E2A] flex items-center gap-1 text-sm hover:underline">
                      <Check size={14} /> Edit
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded p-4">
                    <p className="text-gray-800">{profile?.name || user?.name || 'User'}</p>
                    <p className="text-gray-800">{profile?.email || user?.email || 'user@email.com'}</p>
                    <p className="text-gray-800">{profile?.phone || user?.phone || '9999999999'}</p>
                    <div className="mt-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        profile?.verification_status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : profile?.verification_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : profile?.verification_status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-700'
                      }`}>
                        Verification: {profile?.verification_status === 'approved'
                          ? 'Approved'
                          : profile?.verification_status === 'pending'
                            ? 'Pending Review'
                            : profile?.verification_status === 'rejected'
                              ? 'Declined'
                              : 'Not Verified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Newsletter */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Newsletters</h3>
                    <button className="text-[#9D7E2A] flex items-center gap-1 text-sm hover:underline">
                      <Check size={14} /> Edit
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded p-4">
                    <p className="text-gray-600">You haven't subscribed to our newsletter</p>
                    <button className="mt-4 px-6 py-2 border-2 border-[#9D7E2A] text-[#9D7E2A] rounded-full hover:bg-[#9D7E2A] hover:text-white transition font-medium">
                      Edit
                    </button>
                  </div>
                </div>

                {/* Address Book */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Address Book</h3>
                    <button className="text-[#9D7E2A] flex items-center gap-1 text-sm hover:underline">
                      Manage Addresses
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="border border-gray-200 rounded p-4">
                        <p className="font-semibold text-gray-800">{addr.name}</p>
                        <p className="text-gray-600">{addr.address}</p>
                        <p className="text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-gray-600">India</p>
                        <p className="text-gray-600">T: {addr.phone}</p>
                        {addr.isDefault && (
                          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            Default Billing Address
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">Identity Verification</h3>
                  <p className="text-gray-600">Verify your identity for enhanced security and benefits</p>
                  
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        profile?.verification_status === 'approved' ? 'bg-green-500' : 
                        profile?.verification_status === 'pending' ? 'bg-yellow-500' :
                        profile?.verification_status === 'rejected' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`}></div>
                      <p className="text-sm font-medium text-gray-700">
                        Status: {
                          profile?.verification_status === 'approved' ? 'Approved' : 
                          profile?.verification_status === 'pending' ? 'Pending Review' :
                          profile?.verification_status === 'rejected' ? 'Declined' :
                          'Not Verified'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload proof form */}
                <div className="mb-8 border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4">Upload ID Proof</h4>
                  <form onSubmit={handleSubmitProof} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                      <select 
                        value={documentType} 
                        onChange={(e) => setDocumentType(e.target.value)} 
                        className="w-full border border-gray-300 rounded px-4 py-2"
                        required
                      >
                        <option value="">Select Document Type</option>
                        <option value="aadhaar">Aadhaar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="voter">Voter ID</option>
                        <option value="driving">Driving License</option>
                        <option value="passport">Passport</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                      <input 
                        type="text" 
                        value={documentNumber} 
                        onChange={(e) => setDocumentNumber(e.target.value)} 
                        className="w-full border border-gray-300 rounded px-4 py-2"
                        placeholder="Enter document number"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                      <input 
                        type="file" 
                        accept="image/*, application/pdf" 
                        onChange={(e) => setDocumentFile(e.target.files[0])} 
                        className="w-full border border-gray-300 rounded px-4 py-2"
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={() => { setDocumentType(''); setDocumentNumber(''); setDocumentFile(null); }}
                        className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={submittingProof}
                        className="px-6 py-2 bg-[#9D7E2A] text-white rounded hover:bg-yellow-700 font-medium"
                      >
                        {submittingProof ? 'Submitting...' : 'Submit Proof'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Previous proofs */}
                {proofs.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium mb-4">Submitted Proofs</h4>
                    <div className="space-y-3">
                      {proofs.map((proof) => (
                        <div key={proof.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-800">
                              {proof.document_type.charAt(0).toUpperCase() + proof.document_type.slice(1)} • {proof.document_number}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              proof.status === 'approved' ? 'bg-green-100 text-green-800' : 
                              proof.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {proof.status.charAt(0).toUpperCase() + proof.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Submitted: {new Date(proof.uploaded_at).toLocaleDateString()}
                          </p>
                          {proof.document_path && (
                            <a href={getImageUrl(proof.document_path)} target="_blank" className="mt-2 text-[#9D7E2A] text-sm hover:underline flex items-center gap-1">
                              View Document
                            </a>
                          )}
                          {proof.review_notes && (
                            <p className="text-xs text-gray-600 mt-2 italic">
                              Notes: {proof.review_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">My Orders</h3>
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
                      {orders.map((order) => (
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
            )}

            {activeTab === 'wishlist' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">My Wish List</h3>
                <p className="text-gray-600">
                  <Link to="/wishlist" className="text-[#9D7E2A] hover:underline">Click here</Link> to view your wishlist
                </p>
              </div>
            )}

            {activeTab === 'address' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Address Book</h3>
                  <button 
                    onClick={() => setShowAddressModal(true)}
                    className="text-[#9D7E2A] flex items-center gap-1 text-sm hover:underline"
                  >
                    Add New Address
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="border border-gray-200 rounded p-4 relative">
                      <p className="font-semibold text-gray-800">{addr.name}</p>
                      <p className="text-gray-600">{addr.address}</p>
                      <p className="text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-gray-600">India</p>
                      <p className="text-gray-600">T: {addr.phone}</p>
                      {addr.isDefault && (
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          Default Billing Address
                        </span>
                      )}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleEditAddress(addr)}
                          className="text-[#9D7E2A] hover:underline text-sm flex items-center gap-1"
                        >
                          <Check size={14} /> Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'account-info' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Account Information</h3>
                <div className="max-w-xl border border-gray-200 rounded p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="text-gray-900">{profile?.name || user?.name || 'User'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="text-gray-900">{profile?.email || user?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-gray-900">{profile?.phone || user?.phone || '-'}</p>
                  </div>
                  <p className="text-sm text-gray-500">Account editing will be available here soon.</p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">My Product Reviews</h3>
                <div className="border border-gray-200 rounded p-6 text-gray-600">
                  You have not submitted any product reviews yet.
                </div>
              </div>
            )}

            {activeTab === 'newsletter' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Newsletter Subscriptions</h3>
                <div className="max-w-xl border border-gray-200 rounded p-6">
                  <label className="flex items-start gap-3 text-gray-700">
                    <input
                      type="checkbox"
                      checked={newsletterSubscribed}
                      onChange={(event) => {
                        setNewsletterSubscribed(event.target.checked);
                        toast.success(event.target.checked ? 'Newsletter subscription enabled' : 'Newsletter subscription disabled');
                      }}
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      <span className="block font-medium">Jewellery offers and updates</span>
                      Receive new collection announcements, offers, and gold-rate updates by email.
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded max-w-md w-full mx-4 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingAddress ? 'Edit Address' : 'Add Address'}</h3>
              <button
                onClick={() => { setShowAddressModal(false); setEditingAddress(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  required
                  rows={3}
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    required
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    required
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  required
                  type="text"
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-[#9D7E2A]" />
                <input
                  type="checkbox"
                  id="defaultAddress"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                />
                <label htmlFor="defaultAddress" className="text-sm text-gray-700">Set as default address</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddressModal(false); setEditingAddress(null); }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#9D7E2A] text-white py-2 rounded font-semibold hover:bg-yellow-700 transition"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
