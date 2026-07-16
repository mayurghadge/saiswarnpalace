import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoldRate } from '../contexts/GoldRateContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Percent,
  Settings,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Edit,
  Plus,
  Trash2,
  LogOut,
  Eye,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/admin' : 'http://localhost:5000/api/admin');
const SERVER_BASE =
  import.meta.env.VITE_SERVER_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
const ADMIN_AUTO_REFRESH_MS = 20000;
const CLOUDINARY_FALLBACK = 'https://res.cloudinary.com/dayhebhj7/image/upload/f_auto,q_auto,w_300,h_300,c_fill/v1780295778/chain_nxgghq.jpg';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const getImageUrl = (url) => {
  if (!url) return CLOUDINARY_FALLBACK;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${SERVER_BASE}/${url}`;
};

const getCouponStatusMeta = (coupon) => {
  const now = new Date();
  const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
  const validTo = coupon.valid_to ? new Date(coupon.valid_to) : null;
  const validToEnd = validTo ? new Date(validTo) : null;
  const usageLimit = Number(coupon.usage_limit || 0);
  const usedCount = Number(coupon.used_count || 0);
  const minOrderValue = Number(coupon.min_order_value || 0);

  if (validToEnd) {
    validToEnd.setHours(23, 59, 59, 999);
  }

  if (!coupon.is_active) {
    return {
      label: 'Inactive',
      badgeClass: 'bg-red-100 text-red-800',
      hint: 'Disabled by admin'
    };
  }

  if (validFrom && now < validFrom) {
    return {
      label: 'Scheduled',
      badgeClass: 'bg-blue-100 text-blue-800',
      hint: `Starts ${validFrom.toLocaleDateString()}`
    };
  }

  if (validToEnd && now > validToEnd) {
    return {
      label: 'Expired',
      badgeClass: 'bg-red-100 text-red-800',
      hint: `Ended ${validToEnd.toLocaleDateString()}`
    };
  }

  if (usageLimit > 0 && usedCount >= usageLimit) {
    return {
      label: 'Limit Reached',
      badgeClass: 'bg-amber-100 text-amber-800',
      hint: `${usedCount}/${usageLimit} used`
    };
  }

  const expiresToday = validToEnd && now.toDateString() === validToEnd.toDateString();
  if (expiresToday) {
    return {
      label: 'Expires Today',
      badgeClass: 'bg-orange-100 text-orange-800',
      hint: minOrderValue > 0 ? `Min order ₹${minOrderValue}` : 'Valid until tonight'
    };
  }

  return {
    label: 'Active',
    badgeClass: 'bg-green-100 text-green-800',
    hint: minOrderValue > 0 ? `Min order ₹${minOrderValue}` : 'Ready to apply'
  };
};

const formatCouponValidity = (coupon) => {
  const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
  const validTo = coupon.valid_to ? new Date(coupon.valid_to) : null;

  if (!validFrom && !validTo) return 'Always active';
  if (validFrom && validTo) {
    return `${validFrom.toLocaleDateString()} - ${validTo.toLocaleDateString()}`;
  }
  if (validFrom) return `From ${validFrom.toLocaleDateString()}`;
  return `Until ${validTo.toLocaleDateString()}`;
};

const getCouponSortTime = (coupon) => {
  if (!coupon.valid_to) return Number.MAX_SAFE_INTEGER;
  const validTo = new Date(coupon.valid_to);
  validTo.setHours(23, 59, 59, 999);
  return validTo.getTime();
};

const createEmptyCouponForm = () => ({
  code: '', discount_type: 'PERCENTAGE', discount_value: '', min_order_value: '',
  max_discount: '', usage_limit: '', valid_from: '', valid_to: '', is_active: true
});

const COUPON_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'expired', label: 'Expired' },
  { id: 'expires-today', label: 'Expires Today' },
  { id: 'inactive', label: 'Inactive' },
];

const COUPON_FILTER_IDS = new Set(COUPON_FILTER_OPTIONS.map((option) => option.id));
const ADMIN_TAB_IDS = new Set([
  'dashboard',
  'products',
  'categories',
  'orders',
  'users',
  'verification',
  'coupons',
  'contacts',
  'settings',
]);

const getCouponFilterButtonClass = (filterId, isActive) => {
  const styleMap = {
    all: {
      active: 'bg-slate-700 text-white border-slate-700',
      idle: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400',
    },
    active: {
      active: 'bg-emerald-600 text-white border-emerald-600',
      idle: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400',
    },
    expired: {
      active: 'bg-rose-600 text-white border-rose-600',
      idle: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400',
    },
    'expires-today': {
      active: 'bg-orange-500 text-white border-orange-500',
      idle: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400',
    },
    inactive: {
      active: 'bg-zinc-700 text-white border-zinc-700',
      idle: 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:border-zinc-500',
    },
  };

  const selectedStyle = styleMap[filterId] || styleMap.all;
  return isActive ? selectedStyle.active : selectedStyle.idle;
};

const getInitialAdminViewState = () => {
  const params = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

  const queryTab = params.get('tab');
  const queryCouponFilter = params.get('couponFilter');
  const queryCouponSearch = params.get('couponSearch');

  return {
    activeTab: queryTab && ADMIN_TAB_IDS.has(queryTab) ? queryTab : 'dashboard',
    couponFilter: queryCouponFilter && COUPON_FILTER_IDS.has(queryCouponFilter) ? queryCouponFilter : 'all',
    couponSearchInput: queryCouponSearch || '',
  };
};

const validateCouponForm = (couponForm) => {
  const errors = {};
  const code = String(couponForm.code || '').trim().toUpperCase();
  const discountValue = Number(couponForm.discount_value);
  const minOrderValue = couponForm.min_order_value === '' ? null : Number(couponForm.min_order_value);
  const maxDiscount = couponForm.max_discount === '' ? null : Number(couponForm.max_discount);
  const usageLimit = couponForm.usage_limit === '' ? null : Number(couponForm.usage_limit);

  if (!code) {
    errors.code = 'Coupon code is required';
  } else if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    errors.code = 'Use 3-30 letters, numbers, hyphen, or underscore';
  }

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    errors.discount_value = 'Discount value must be greater than 0';
  } else if (couponForm.discount_type === 'PERCENTAGE' && discountValue > 100) {
    errors.discount_value = 'Percentage discount cannot exceed 100';
  }

  if (minOrderValue != null && (!Number.isFinite(minOrderValue) || minOrderValue < 0)) {
    errors.min_order_value = 'Minimum order must be 0 or more';
  }

  if (maxDiscount != null) {
    if (!Number.isFinite(maxDiscount) || maxDiscount <= 0) {
      errors.max_discount = 'Max discount must be greater than 0';
    } else if (couponForm.discount_type === 'FIXED' && Number.isFinite(discountValue) && maxDiscount < discountValue) {
      errors.max_discount = 'Max discount cannot be less than fixed discount value';
    }
  }

  if (usageLimit != null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) {
    errors.usage_limit = 'Usage limit must be a whole number greater than 0';
  }

  if (couponForm.valid_from && couponForm.valid_to && new Date(couponForm.valid_to) < new Date(couponForm.valid_from)) {
    errors.valid_to = 'Valid to date cannot be before valid from date';
  }

  return errors;
};

const buildCouponPayload = (couponForm) => ({
  ...couponForm,
  code: String(couponForm.code || '').trim().toUpperCase(),
  discount_value: Number(couponForm.discount_value),
  min_order_value: couponForm.min_order_value === '' ? '' : Number(couponForm.min_order_value),
  max_discount: couponForm.max_discount === '' ? '' : Number(couponForm.max_discount),
  usage_limit: couponForm.usage_limit === '' ? '' : Number(couponForm.usage_limit),
});

const getCouponPreviewText = (couponForm) => {
  const code = String(couponForm.code || '').trim().toUpperCase() || 'COUPON';
  const discountValue = Number(couponForm.discount_value || 0);
  const minOrderValue = couponForm.min_order_value === '' ? null : Number(couponForm.min_order_value);
  const maxDiscount = couponForm.max_discount === '' ? null : Number(couponForm.max_discount);
  const usageLimit = couponForm.usage_limit === '' ? null : Number(couponForm.usage_limit);

  const parts = [];

  if (discountValue > 0) {
    parts.push(
      couponForm.discount_type === 'PERCENTAGE'
        ? `${discountValue}% off`
        : `flat ₹${discountValue} off`
    );
  } else {
    parts.push('discount not set yet');
  }

  if (couponForm.discount_type === 'PERCENTAGE' && maxDiscount && maxDiscount > 0) {
    parts.push(`capped at ₹${maxDiscount}`);
  }

  if (minOrderValue && minOrderValue > 0) {
    parts.push(`min order ₹${minOrderValue}`);
  }

  if (usageLimit && usageLimit > 0) {
    parts.push(`${usageLimit} total uses`);
  } else {
    parts.push('unlimited uses');
  }

  if (couponForm.valid_from || couponForm.valid_to) {
    const fromText = couponForm.valid_from || 'now';
    const toText = couponForm.valid_to || 'no end date';
    parts.push(`valid ${fromText} to ${toText}`);
  }

  parts.push(couponForm.is_active ? 'currently active' : 'currently inactive');

  return `${code}: ${parts.join(' • ')}`;
};

const AdminDashboard = () => {
  const initialAdminViewState = getInitialAdminViewState();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(initialAdminViewState.activeTab);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', discount_price: '', category_id: '',
    material: '', weight: '', purity: '22k', making_charges: '', wastage_percentage: '',
    diamond_price: '', item_code: '', huid_hallmark: '', images: '', stock: '', is_featured: false, is_active: true
  });
  const [productImageFile, setProductImageFile] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', image: '' });
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [couponForm, setCouponForm] = useState(createEmptyCouponForm());
  const [couponErrors, setCouponErrors] = useState({});
  const [couponFilter, setCouponFilter] = useState(initialAdminViewState.couponFilter);
  const [couponSearchInput, setCouponSearchInput] = useState(initialAdminViewState.couponSearchInput);
  const [couponSearch, setCouponSearch] = useState(initialAdminViewState.couponSearchInput.trim());

  // Verification States
  const [selectedUserProofs, setSelectedUserProofs] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loadingVerification, setLoadingVerification] = useState(false);

  const sortedCoupons = [...coupons].sort((a, b) => {
    const timeDiff = getCouponSortTime(a) - getCouponSortTime(b);
    if (timeDiff !== 0) return timeDiff;
    return String(a.code || '').localeCompare(String(b.code || ''));
  });

  const couponFilterCounts = sortedCoupons.reduce(
    (acc, coupon) => {
      const statusLabel = getCouponStatusMeta(coupon).label;
      acc.all += 1;
      if (statusLabel === 'Active') acc.active += 1;
      if (statusLabel === 'Expired') acc.expired += 1;
      if (statusLabel === 'Expires Today') acc['expires-today'] += 1;
      if (statusLabel === 'Inactive') acc.inactive += 1;
      return acc;
    },
    {
      all: 0,
      active: 0,
      expired: 0,
      'expires-today': 0,
      inactive: 0,
    }
  );

  const filteredCoupons = sortedCoupons.filter((coupon) => {
    const matchesSearch = String(coupon.code || '').toLowerCase().includes(couponSearch.trim().toLowerCase());
    if (!matchesSearch) return false;
    if (couponFilter === 'all') return true;
    const statusLabel = getCouponStatusMeta(coupon).label;
    if (couponFilter === 'active') return statusLabel === 'Active';
    if (couponFilter === 'expired') return statusLabel === 'Expired';
    if (couponFilter === 'expires-today') return statusLabel === 'Expires Today';
    if (couponFilter === 'inactive') return statusLabel === 'Inactive';
    return true;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setCouponSearch(couponSearchInput.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [couponSearchInput]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryTab = params.get('tab');
    const queryCouponFilter = params.get('couponFilter');
    const queryCouponSearch = params.get('couponSearch');

    if (queryTab && ADMIN_TAB_IDS.has(queryTab) && queryTab !== activeTab) {
      setActiveTab(queryTab);
    }

    if (queryCouponFilter && COUPON_FILTER_IDS.has(queryCouponFilter) && queryCouponFilter !== couponFilter) {
      setCouponFilter(queryCouponFilter);
    }

    if (queryCouponSearch !== null && queryCouponSearch !== couponSearchInput) {
      setCouponSearchInput(queryCouponSearch);
    }

    if (queryCouponSearch === null && couponSearchInput !== '') {
      setCouponSearchInput('');
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams();
    const normalizedCouponSearchInput = couponSearchInput.trim();
    params.set('tab', activeTab);

    if (activeTab === 'coupons') {
      if (couponFilter !== 'all') {
        params.set('couponFilter', couponFilter);
      }
      if (normalizedCouponSearchInput) {
        params.set('couponSearch', normalizedCouponSearchInput);
      }
    }

    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;

    if (nextSearch !== currentSearch) {
      navigate(`${location.pathname}?${nextSearch}`, { replace: true });
    }
  }, [activeTab, couponFilter, couponSearchInput, location.pathname, location.search, navigate]);

  const { goldRate18k, setGoldRate18k, goldRate22k, setGoldRate22k, goldRate24k, setGoldRate24k,
    silverRate, setSilverRate, gstRate, setGstRate } = useGoldRate();

  const loadDashboardData = async () => {
    try {
      const [statsRes, productsRes, ordersRes, usersRes, contactsRes, couponsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/products`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/orders`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/contacts`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/coupons`, { headers: getAuthHeaders() }),
      ]);

      const statsData = await statsRes.json();
      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();
      const usersData = await usersRes.json();
      const contactsData = await contactsRes.json();
      const couponsData = await couponsRes.json();

      setDashboardStats(statsData);
      setProducts(productsData.products || []);
      setOrders(ordersData.orders || []);
      setUsers(usersData.users || []);
      setContacts(contactsData.contacts || []);
      setCoupons(couponsData.coupons || []);

      if (statsData.goldRates) {
        setGoldRate18k(statsData.goldRates.gold_rate_18k);
        setGoldRate22k(statsData.goldRates.gold_rate_22k);
        setGoldRate24k(statsData.goldRates.gold_rate_24k);
        setSilverRate(statsData.goldRates.silver_rate || 266);
        setGstRate(statsData.goldRates.gst_rate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, { headers: getAuthHeaders() });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem('adminLoggedIn');
    const adminToken = localStorage.getItem('adminToken');
    if (!isAdmin || !adminToken) {
      navigate('/admin-login');
      return;
    }

    loadDashboardData();
    loadCategories();

    const handleTabActiveRefresh = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData();
      }
    };

    const handleWindowFocus = () => {
      loadDashboardData();
    };

    const refreshTimer = setInterval(() => {
      loadDashboardData();
    }, ADMIN_AUTO_REFRESH_MS);

    document.addEventListener('visibilitychange', handleTabActiveRefresh);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', handleTabActiveRefresh);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [navigate]);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `${API_BASE_URL}/products/${editingProduct.id}` : `${API_BASE_URL}/products`;
      const method = editingProduct ? 'PUT' : 'POST';
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

      const formData = new FormData();
      for (let key in productForm) {
        if (productForm[key] !== null && productForm[key] !== undefined) {
          formData.append(key, productForm[key]);
        }
      }
      if (productImageFile) {
        formData.append('product_image', productImageFile);
      }

      const res = await fetch(url, {
        method, headers: { 'Authorization': `Bearer ${token}` }, body: formData,
      });

      if (res.ok) {
        toast.success(editingProduct ? 'Product updated' : 'Product added');
        setShowProductModal(false);
        setProductImageFile(null);
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const url = editingCategory ? `${API_BASE_URL}/categories/${editingCategory.id}` : `${API_BASE_URL}/categories`;
      const method = editingCategory ? 'PUT' : 'POST';
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

      const formData = new FormData();
      for (let key in categoryForm) {
        if (categoryForm[key] !== null && categoryForm[key] !== undefined) {
          formData.append(key, categoryForm[key]);
        }
      }
      if (categoryImageFile) {
        formData.append('category_image', categoryImageFile);
      }

      const res = await fetch(url, {
        method, headers: { 'Authorization': `Bearer ${token}` }, body: formData,
      });

      if (res.ok) {
        toast.success(editingCategory ? 'Category updated' : 'Category added');
        setShowCategoryModal(false);
        setCategoryImageFile(null);
        loadCategories();
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('Delete product?')) {
      try {
        await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        setProducts(products.filter(p => p.id !== id));
        toast.success('Product deleted');
      } catch (err) {
        toast.error('Failed');
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('Delete category?')) {
      try {
        await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        setCategories(categories.filter(c => c.id !== id));
        toast.success('Category deleted');
      } catch (err) {
        toast.error('Failed');
      }
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const validationErrors = validateCouponForm(couponForm);
    if (Object.keys(validationErrors).length > 0) {
      setCouponErrors(validationErrors);
      toast.error('Please correct the coupon form errors');
      return;
    }

    try {
      const url = editingCoupon ? `${API_BASE_URL}/coupons/${editingCoupon.id}` : `${API_BASE_URL}/coupons`;
      const method = editingCoupon ? 'PUT' : 'POST';
      const payload = buildCouponPayload(couponForm);
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingCoupon ? 'Coupon updated' : 'Coupon added');
        setShowCouponModal(false);
        setCouponErrors({});
        loadDashboardData();
      } else {
        toast.error(data.message || 'Failed to save coupon');
      }
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleCouponFormChange = (field, value) => {
    setCouponForm((prev) => ({ ...prev, [field]: value }));
    setCouponErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleDeleteCoupon = async (id) => {
    if (confirm('Delete coupon?')) {
      try {
        await fetch(`${API_BASE_URL}/coupons/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        setCoupons(coupons.filter(c => c.id !== id));
        toast.success('Coupon deleted');
      } catch (err) {
        toast.error('Failed');
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (confirm('Delete user?')) {
      try {
        await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        setUsers(users.filter(u => u.id !== id));
        toast.success('User deleted');
      } catch (err) {
        toast.error('Failed');
      }
    }
  };

  const handleUpdateContactStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE_URL}/contacts/${id}/status`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status }),
      });
      setContacts(contacts.map(c => c.id === id ? { ...c, status } : c));
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ order_status: status }),
      });
      setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: status } : o));
      if (selectedOrder && selectedOrder.order?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, order: { ...prev.order, order_status: status } } : null);
      }
      toast.success(`Order status: ${status}`);
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleLoadOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setSelectedOrder(data);
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleSaveRates = async () => {
    try {
      await fetch(`${API_BASE_URL}/gold-rates`, {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({
          gold_rate_18k: goldRate18k, gold_rate_22k: goldRate22k,
          gold_rate_24k: goldRate24k, silver_rate: silverRate,
          gst_rate: gstRate,
        }),
      });
      toast.success('Saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed');
    }
  };

  // Proof Management
  const handleViewUserProofs = async (userId) => {
    try {
      setLoadingVerification(true);
      const res = await fetch(`${API_BASE_URL}/users/${userId}/proofs`, { headers: getAuthHeaders() });
      const data = await res.json();
      setSelectedUserProofs(data);
      setShowVerificationModal(true);
    } catch (err) {
      toast.error('Failed to load');
      console.error(err);
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleApproveProof = async (proofId) => {
    try {
      await fetch(`${API_BASE_URL}/users/${selectedUserProofs.user?.id}/proofs/${proofId}/approve`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ notes: reviewNotes }),
      });
      toast.success('Approved');
      handleViewUserProofs(selectedUserProofs.user.id);
      loadDashboardData();
      setReviewNotes('');
    } catch (err) {
      toast.error('Failed');
      console.error(err);
    }
  };

  const handleRejectProof = async (proofId) => {
    try {
      await fetch(`${API_BASE_URL}/users/${selectedUserProofs.user?.id}/proofs/${proofId}/reject`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ notes: reviewNotes }),
      });
      toast.success('Rejected');
      handleViewUserProofs(selectedUserProofs.user.id);
      loadDashboardData();
      setReviewNotes('');
    } catch (err) {
      toast.error('Failed');
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'categories', icon: Tag, label: 'Categories' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'verification', icon: ShieldCheck, label: 'Verification Requests' },
    { id: 'coupons', icon: Percent, label: 'Coupons' },
    { id: 'contacts', icon: MessageSquare, label: 'Contacts' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-black text-white flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#9D7E2A]">Sai Swarn Palace</h1>
          <p className="text-gray-400 text-sm">Admin Panel</p>
        </div>
        <nav className="px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === item.id ? 'bg-[#9D7E2A] text-black' : 'hover:bg-gray-800'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
          <button
            onClick={() => { localStorage.removeItem('adminLoggedIn'); localStorage.removeItem('adminToken'); navigate('/admin-login'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition hover:bg-red-900 text-red-400 mt-8"
          >
            <LogOut size={20} />
            LogOut
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div>
            <div className="flex justify-between mb-8">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <div className="text-gray-500">{new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</div>
            </div>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Orders', value: dashboardStats?.totalOrders || 0, icon: ShoppingBag, color: 'text-[#9D7E2A] bg-[#9D7E2A]/10' },
                { label: 'Total Products', value: dashboardStats?.totalProducts || 0, icon: Package, color: 'text-blue-600 bg-blue-100' },
                { label: 'Total Users', value: dashboardStats?.totalUsers || 0, icon: Users, color: 'text-green-600 bg-green-100' },
                { label: '24K Gold Rate', value: '₹' + (dashboardStats?.goldRates?.gold_rate_24k || 0), icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
                { label: 'Silver Rate', value: '₹' + (dashboardStats?.goldRates?.silver_rate || 0), icon: TrendingUp, color: 'text-slate-600 bg-slate-100' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Recent Orders</h2>
                <div className="space-y-4">
                  {orders.slice(0,3).map((order) => (
                    <div key={order.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1"><p className="font-bold">{order.order_number}</p><p className="text-sm text-gray-500">{order.user_name}</p></div>
                      <p className="font-bold text-[#9D7E2A]">₹{order.total?.toLocaleString()}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>{order.order_status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Products</h2>
                <div className="space-y-4">
                  {products.slice(0,3).map(product => (
                    <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <img src={getImageUrl(product.images)} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.category_name} • {product.purity}</p>
                      </div>
                      <p className="text-xs text-green-500">Stock: {product.stock}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between mb-8">
              <h1 className="text-3xl font-bold">Products Management</h1>
              <button onClick={() => { setEditingProduct(null); setProductForm({name: '', description: '', price: '', discount_price: '', category_id: categories.length>0?categories[0].id:'', material: '', weight: '', purity: '22k', making_charges: '', wastage_percentage: '', diamond_price: '', item_code: '', huid_hallmark: '', images: '', stock: '', is_featured: false, is_active: true }); setShowProductModal(true); }} 
                className="flex items-center gap-2 px-6 py-3 bg-[#9D7E2A] text-white rounded-lg font-semibold">
                <Plus size={20} /> Add
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="p-4 text-left">Product</th><th className="p-4 text-left">Category</th><th className="p-4 text-left">Price</th><th className="p-4 text-left">Stock</th><th className="p-4 text-left">Actions</th></tr></thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-t">
                      <td className="p-4"><div className="flex items-center gap-4"><img src={getImageUrl(product.images)} alt={product.name} className="w-12 h-12 rounded" /><span className="font-medium">{product.name}</span></div></td>
                      <td className="p-4">{product.category_name}</td>
                      <td className="p-4 text-[#9D7E2A] font-bold">₹{product.price?.toLocaleString()}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-sm ${product.stock<5?'bg-red-100 text-red-800':'bg-green-100 text-green-800'}`}>{product.stock} in stock</span></td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingProduct(product); setProductForm({ ...product }); setShowProductModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50"><Edit size={16}/></button>
                          <button onClick={()=> handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between mb-8">
              <h1 className="text-3xl font-bold">Categories</h1>
              <button onClick={() => { setEditingCategory(null); setCategoryForm({name:'', description:'', image:''}); setShowCategoryModal(true); }} 
                className="flex items-center gap-2 px-6 py-3 bg-[#9D7E2A] text-white rounded-lg font-semibold">
                <Plus size={20} /> Add
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full"><thead className="bg-gray-50"><tr><th className="p-4 text-left">Category</th><th className="p-4 text-left">Slug</th><th className="p-4 text-left">Created</th><th className="p-4 text-left">Actions</th></tr></thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category.id} className="border-t">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          {category.image && <img src={getImageUrl(category.image)} alt={category.name} className="w-12 h-12 rounded"/>}
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </td>
                      <td className="p-4">{category.slug || '-'}</td>
                      <td className="p-4">{category.created_at ? new Date(category.created_at).toLocaleDateString() : '-'}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingCategory(category); setCategoryForm({ ...category }); setShowCategoryModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-red-600 hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'users' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Users Management</h1>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="p-4 text-left">Name</th><th className="p-4 text-left">Email</th><th className="p-4 text-left">Phone</th><th className="p-4 text-left">Orders</th><th className="p-4 text-left">Verification</th><th className="p-4 text-left">Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t">
                      <td className="p-4">{user.name}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">{user.phone}</td>
                      <td className="p-4">{user.orders_count}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getVerificationColor(user.verification_status)}`}>{user.verification_status || 'not verified'}</span></td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleViewUserProofs(user.id)} className="p-2 text-[#9D7E2A] hover:bg-[#9D7E2A]/10"><Eye size={16} /></button>
                          <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-600 hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'verification' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Verification Requests</h1>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <p className="text-gray-500">Go to the <strong>Users</strong> tab to view verification requests for individual users!</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'orders' && !selectedOrder && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Orders</h1>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="p-4 text-left">Order #</th><th className="p-4 text-left">Customer</th><th className="p-4 text-left">Date</th><th className="p-4 text-left">Total</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Actions</th></tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-t">
                      <td className="p-4 font-bold">{order.order_number}</td>
                      <td className="p-4"><div><p className="font-medium">{order.user_name}</p><p className="text-sm text-gray-500">{order.user_email}</p></div></td>
                      <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-[#9D7E2A]">₹{order.total?.toLocaleString()}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>{order.order_status}</span></td>
                      <td className="p-4">
                        <button onClick={() => handleLoadOrderDetails(order.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'orders' && selectedOrder && (
          <div>
            <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-[#9D7E2A] hover:underline mb-6"><ArrowUpRight size={20} className="rotate-180" /> Back</button>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between mb-8">
                <div><h1 className="text-3xl font-bold">Order {selectedOrder.order?.order_number}</h1><p className="text-gray-500 mt-2">{new Date(selectedOrder.order?.created_at).toLocaleDateString()}</p></div>
                <span className={`px-6 py-3 rounded-full font-semibold ${getStatusColor(selectedOrder.order?.order_status)}`}>{selectedOrder.order?.order_status}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div><h2 className="text-xl font-bold mb-4">Customer</h2><div className="p-6 bg-gray-50 rounded-xl"><p className="font-semibold">{selectedOrder.order?.user_name}</p><p className="text-gray-600">{selectedOrder.order?.user_email}</p><p className="text-gray-600">{selectedOrder.order?.user_phone}</p></div></div>
              </div>
              <div className="mb-8"><h2 className="text-xl font-bold mb-4">Items</h2>
                <div className="space-y-4">
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <img src={getImageUrl(item.product_image)} alt={item.product_name} className="w-16 h-16 rounded"/>
                      <div className="flex-1"><p className="font-semibold">{item.product_name}</p><p className="text-gray-500 text-sm">Qty: {item.quantity}</p></div>
                      <p className="font-bold text-lg">₹{item.price?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Summary</h2>
                <div className="p-6 bg-gray-50 rounded-xl">
                  <div className="flex justify-between py-3 border-b"><span className="text-gray-600">Subtotal</span><span className="font-semibold">₹{selectedOrder.order?.subtotal?.toLocaleString()}</span></div>
                  {selectedOrder.order?.discount>0 && <div className="flex justify-between py-3 border-b"><span className="text-gray-600">Discount</span><span className="font-semibold text-green-600">-₹{selectedOrder.order.discount?.toLocaleString()}</span></div>}
                  <div className="flex justify-between py-3 border-b"><span className="text-gray-600">Tax</span><span className="font-semibold">₹{selectedOrder.order?.tax?.toLocaleString()}</span></div>
                  <div className="flex justify-between py-4 mt-2"><span className="text-xl font-bold">Total</span><span className="text-xl font-bold text-[#9D7E2A]">₹{selectedOrder.order?.total?.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="mb-8"><h2 className="text-xl font-bold mb-4">Update Status</h2>
                <div className="flex flex-wrap gap-3">
                  {['pending','processing','shipped','delivered','cancelled'].map(status => (
                    <button key={status} onClick={() => handleUpdateOrderStatus(selectedOrder.order?.id, status)} 
                      className={`px-6 py-3 rounded-lg font-semibold transition ${selectedOrder.order?.order_status===status?'bg-[#9D7E2A] text-white':'border border-gray-300 hover:bg-gray-50'}`}
                    >{status.charAt(0).toUpperCase() + status.slice(1)}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'coupons' && (
          <div>
            <div className="flex justify-between mb-8">
              <h1 className="text-3xl font-bold">Coupons</h1>
              <button onClick={() => { setEditingCoupon(null); setCouponForm(createEmptyCouponForm()); setCouponErrors({}); setShowCouponModal(true); }} 
                className="flex items-center gap-2 px-6 py-3 bg-[#9D7E2A] text-white rounded-lg font-semibold">
                <Plus size={20} /> Add
              </button>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-200" />
                <span>Expires today</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-200" />
                <span>Expired</span>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {COUPON_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCouponFilter(option.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${getCouponFilterButtonClass(option.id, couponFilter === option.id)}`}
                >
                  {option.label} ({couponFilterCounts[option.id] || 0})
                </button>
              ))}
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={couponSearchInput}
                onChange={(e) => setCouponSearchInput(e.target.value)}
                placeholder="Search by coupon code..."
                className="w-full max-w-sm rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#9D7E2A] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCouponSearchInput('')}
                disabled={!couponSearchInput}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-[#9D7E2A] hover:text-[#9D7E2A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setCouponSearchInput('');
                  setCouponFilter('all');
                }}
                disabled={!couponSearchInput && couponFilter === 'all'}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-[#9D7E2A] hover:text-[#9D7E2A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear Filters
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full"><thead className="bg-gray-50"><tr><th className="p-4 text-left">Code</th><th className="p-4 text-left">Discount</th><th className="p-4 text-left">Usage</th><th className="p-4 text-left">Validity</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Actions</th></tr></thead>
                <tbody>
                  {filteredCoupons.map(coupon => {
                    const statusMeta = getCouponStatusMeta(coupon);
                    const rowClassName = statusMeta.label === 'Expired'
                      ? 'border-t bg-red-50/70'
                      : statusMeta.label === 'Expires Today'
                        ? 'border-t bg-orange-50/70'
                        : 'border-t';
                    return (
                    <tr key={coupon.id} className={rowClassName}>
                      <td className="p-4 font-medium">{coupon.code}</td>
                      <td className="p-4">{coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</td>
                      <td className="p-4">{coupon.used_count} / {coupon.usage_limit || 'Unlimited'}</td>
                      <td className="p-4 text-sm text-gray-600">{formatCouponValidity(coupon)}</td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
                          <p className="text-xs text-gray-500">{statusMeta.hint}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingCoupon(coupon); setCouponForm({ ...coupon, valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().split('T')[0] : '', valid_to: coupon.valid_to ? new Date(coupon.valid_to).toISOString().split('T')[0] : '' }); setCouponErrors({}); setShowCouponModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-red-600 hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  )})}
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-sm text-gray-500">
                        No coupons found for this filter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'contacts' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Contact Inquiries</h1>
            <div className="space-y-4">
              {contacts.map(contact => (
                <div key={contact.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{contact.name}</h3>
                      <p className="text-gray-500">{contact.email}</p>
                      <p className="text-gray-700 font-medium mt-2">{contact.subject}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${contact.status === 'new' ? 'bg-yellow-100 text-yellow-800' : contact.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{contact.status}</span>
                  </div>
                  <p className="text-gray-600 mb-4">{contact.message}</p>
                  <p className="text-sm text-gray-500">{new Date(contact.created_at).toLocaleDateString()}</p>
                  <div className="flex gap-3 mt-4">
                    {contact.status === 'new' && <button onClick={() => handleUpdateContactStatus(contact.id, 'in-progress')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Mark In Progress</button>}
                    {contact.status === 'in-progress' && <button onClick={() => handleUpdateContactStatus(contact.id, 'resolved')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Mark Resolved</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Settings</h1>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Gold & Silver Rates</h2>
                <div className="grid md:grid-cols-4 gap-8">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-3">18K Gold Rate (per gram)</label><div className="flex items-center gap-3"><span className="text-gray-500 text-xl">₹</span><input type="number" value={goldRate18k} onChange={(e) => setGoldRate18k(parseInt(e.target.value) || 0)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg" /></div></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-3">22K Gold Rate (per gram)</label><div className="flex items-center gap-3"><span className="text-gray-500 text-xl">₹</span><input type="number" value={goldRate22k} onChange={(e) => setGoldRate22k(parseInt(e.target.value) || 0)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg" /></div></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-3">24K Gold Rate (per gram)</label><div className="flex items-center gap-3"><span className="text-gray-500 text-xl">₹</span><input type="number" value={goldRate24k} onChange={(e) => setGoldRate24k(parseInt(e.target.value) || 0)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg" /></div></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-3">Silver Rate (per gram)</label><div className="flex items-center gap-3"><span className="text-gray-500 text-xl">₹</span><input type="number" value={silverRate} onChange={(e) => setSilverRate(parseInt(e.target.value) || 0)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg" /></div></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6">GST</h2>
                <div className="grid md:grid-cols-1 gap-8">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-3">GST Rate (%)</label><div className="flex items-center gap-3"><input type="number" step="0.1" value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg" /><span className="text-gray-500 text-xl">%</span></div></div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveRates} className="px-8 py-4 bg-[#9D7E2A] text-white rounded-lg font-semibold text-lg hover:bg-yellow-700">Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-2xl font-bold mb-6">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Name</label><input required value={productForm.name} onChange={e=> setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Description</label><textarea value={productForm.description} onChange={e=> setProductForm({...productForm, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" rows={3}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Category</label><select required value={productForm.category_id} onChange={e=> setProductForm({...productForm, category_id: e.target.value})} className="w-full px-4 py-2 border rounded-lg">{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Price</label><input type="number" required value={productForm.price} onChange={e=> setProductForm({...productForm, price: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Discount Price</label><input type="number" value={productForm.discount_price} onChange={e=> setProductForm({...productForm, discount_price: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Stock</label><input type="number" required value={productForm.stock} onChange={e=> setProductForm({...productForm, stock: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Weight (g)</label><input type="number" step="0.01" value={productForm.weight} onChange={e=> setProductForm({...productForm, weight: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Purity</label><select value={productForm.purity} onChange={e=> setProductForm({...productForm, purity: e.target.value})} className="w-full px-4 py-2 border rounded-lg"><option value="24k">24K</option><option value="22k">22K</option><option value="18k">18K</option><option value="999">999 Pure Silver</option><option value="925">925 Silver</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Making Charges / gm</label><input type="number" step="0.01" value={productForm.making_charges} onChange={e=> setProductForm({...productForm, making_charges: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Wastage (%)</label><input type="number" step="0.01" value={productForm.wastage_percentage} onChange={e=> setProductForm({...productForm, wastage_percentage: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Diamond Price</label><input type="number" step="0.01" value={productForm.diamond_price} onChange={e=> setProductForm({...productForm, diamond_price: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Material</label><input type="text" value={productForm.material} onChange={e=> setProductForm({...productForm, material: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Item Code</label><input type="text" value={productForm.item_code} onChange={e=> setProductForm({...productForm, item_code: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: SSP-RNG-001" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">HUID Hallmark</label><input type="text" value={productForm.huid_hallmark} onChange={e=> setProductForm({...productForm, huid_hallmark: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: HUID123456" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label><input type="text" value={productForm.images} onChange={e=> setProductForm({...productForm, images: e.target.value})} className="w-full px-4 py-2 border rounded-lg mb-3" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Upload Image</label><input type="file" accept="image/*" onChange={e=> setProductImageFile(e.target.files[0])} className="w-full" />{productImageFile && <img src={URL.createObjectURL(productImageFile)} alt="Preview" className="mt-3 w-32 h-32 object-cover rounded" />}</div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-[#9D7E2A] text-white rounded-lg font-semibold hover:bg-yellow-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Name</label><input required value={categoryForm.name} onChange={e=> setCategoryForm({...categoryForm, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Description</label><textarea value={categoryForm.description} onChange={e=> setCategoryForm({...categoryForm, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" rows={3}/></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label><input type="text" value={categoryForm.image} onChange={e=> setCategoryForm({...categoryForm, image: e.target.value})} className="w-full px-4 py-2 border rounded-lg mb-3" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Upload Image</label><input type="file" accept="image/*" onChange={e=> setCategoryImageFile(e.target.files[0])} className="w-full" />{categoryImageFile && <img src={URL.createObjectURL(categoryImageFile)} alt="Preview" className="mt-3 w-32 h-32 object-cover rounded" />}</div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-[#9D7E2A] text-white rounded-lg font-semibold hover:bg-yellow-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-2xl font-bold mb-6">{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</h2>
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Live Preview</p>
                <p className="mt-1 text-sm text-amber-900">{getCouponPreviewText(couponForm)}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Code</label>
                <input required value={couponForm.code} onChange={e=> handleCouponFormChange('code', e.target.value.toUpperCase())} className={`w-full px-4 py-2 border rounded-lg ${couponErrors.code ? 'border-red-500' : ''}`} />
                {couponErrors.code ? <p className="mt-1 text-xs text-red-600">{couponErrors.code}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Type</label><select value={couponForm.discount_type} onChange={e=> handleCouponFormChange('discount_type', e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option></select></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Value</label><input type="number" min="0" step="0.01" required value={couponForm.discount_value} onChange={e=> handleCouponFormChange('discount_value', e.target.value)} className={`w-full px-4 py-2 border rounded-lg ${couponErrors.discount_value ? 'border-red-500' : ''}`} />{couponErrors.discount_value ? <p className="mt-1 text-xs text-red-600">{couponErrors.discount_value}</p> : null}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Min Order</label><input type="number" min="0" step="0.01" value={couponForm.min_order_value} onChange={e=> handleCouponFormChange('min_order_value', e.target.value)} className={`w-full px-4 py-2 border rounded-lg ${couponErrors.min_order_value ? 'border-red-500' : ''}`} />{couponErrors.min_order_value ? <p className="mt-1 text-xs text-red-600">{couponErrors.min_order_value}</p> : null}</div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Max Discount</label><input type="number" min="0" step="0.01" value={couponForm.max_discount} onChange={e=> handleCouponFormChange('max_discount', e.target.value)} className={`w-full px-4 py-2 border rounded-lg ${couponErrors.max_discount ? 'border-red-500' : ''}`} />{couponErrors.max_discount ? <p className="mt-1 text-xs text-red-600">{couponErrors.max_discount}</p> : null}</div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Usage Limit</label><input type="number" min="1" step="1" value={couponForm.usage_limit} onChange={e=> handleCouponFormChange('usage_limit', e.target.value)} className={`w-full px-4 py-2 border rounded-lg ${couponErrors.usage_limit ? 'border-red-500' : ''}`} />{couponErrors.usage_limit ? <p className="mt-1 text-xs text-red-600">{couponErrors.usage_limit}</p> : <p className="mt-1 text-xs text-gray-500">Leave empty for unlimited usage</p>}</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Valid From</label><input type="date" value={couponForm.valid_from} onChange={e=> handleCouponFormChange('valid_from', e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Valid To</label><input type="date" value={couponForm.valid_to} onChange={e=> handleCouponFormChange('valid_to', e.target.value)} className={`w-full px-4 py-2 border rounded-lg ${couponErrors.valid_to ? 'border-red-500' : ''}`} />{couponErrors.valid_to ? <p className="mt-1 text-xs text-red-600">{couponErrors.valid_to}</p> : null}</div>
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(couponForm.is_active)}
                  onChange={e => handleCouponFormChange('is_active', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#9D7E2A] focus:ring-[#9D7E2A]"
                />
                Keep this coupon active and available for customers
              </label>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => { setShowCouponModal(false); setCouponErrors({}); }} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-[#9D7E2A] text-white rounded-lg font-semibold hover:bg-yellow-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && selectedUserProofs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Verification Proofs for {selectedUserProofs.user?.name}</h2>
                <p className="text-gray-600 mt-1">{selectedUserProofs.user?.email} • {selectedUserProofs.user?.phone}</p>
              </div>
              <button onClick={() => setShowVerificationModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-6">
              {selectedUserProofs.proofs?.map(proof => (
                <div key={proof.id} className="p-6 border border-gray-200 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-semibold text-gray-800">
                      {proof.document_type.charAt(0).toUpperCase() + proof.document_type.slice(1)} • {proof.document_number}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getVerificationColor(proof.status)}`}>{proof.status.charAt(0).toUpperCase() + proof.status.slice(1)}</span>
                  </div>
                  <div className="mb-4">
                    <a href={getImageUrl(proof.document_path)} target="_blank" className="text-[#9D7E2A] hover:underline">View Document</a>
                  </div>
                  {proof.status === 'pending' && (
                    <div className="space-y-4">
                      <textarea placeholder="Review notes (optional)" value={reviewNotes} onChange={e=> setReviewNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} />
                      <div className="flex gap-3">
                        <button onClick={() => handleApproveProof(proof.id)} className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Approve</button>
                        <button onClick={() => handleRejectProof(proof.id)} className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Reject</button>
                      </div>
                    </div>
                  )}
                  {proof.review_notes && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 italic">Notes: {proof.review_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
