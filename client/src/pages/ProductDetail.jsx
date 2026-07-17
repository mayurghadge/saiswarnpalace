import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useGoldRate } from '../contexts/GoldRateContext';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { calculateDiscountFromCoupon, loadAppliedCoupon } from '../utils/coupons';

const API_BASE =
  import.meta.env.VITE_API_URL || '/api';
const CLOUDINARY_FALLBACK = 'https://res.cloudinary.com/dayhebhj7/image/upload/f_auto,q_auto,w_1200,h_750,c_fill/v1780553055/IMG-20230905-WA0018_khsrzn.jpg';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart, addToWishlist } = useCart();
  const { calculateProductEstimate } = useGoldRate();
  const [product, setProduct] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const zoomRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        const data = await res.json();
        setProduct(data.product || null);
      } catch (err) {
        console.error('Failed to fetch product:', err);
      }
    };

    fetchProduct();
    setAppliedCoupon(loadAppliedCoupon());
  }, [id]);

  const getImageUrl = (value) => {
    const fallback = CLOUDINARY_FALLBACK;

    if (!value) return fallback;
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === 'string' && item.trim());
      return getImageUrl(first);
    }
    if (typeof value !== 'string') return fallback;

    const url = value.trim();
    if (!url) return fallback;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${API_BASE.replace('/api', '')}${url}`;
    }
    return url;
  };

  const estimate = product ? calculateProductEstimate(product) : null;

  const handleImageMouseMove = (e) => {
    if (!zoomRef.current) return;
    const rect = zoomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    zoomRef.current.style.backgroundPosition = `${x}% ${y}%`;
  };

  if (!product) {
    return <div className="py-12 text-center text-gray-600">Loading product...</div>;
  }

  const imageList = (() => {
    const rawImages = product.images || product.image || product.ImageURL || product.image_url;
    if (Array.isArray(rawImages)) {
      return rawImages.map((item) => getImageUrl(item)).filter(Boolean);
    }
    if (typeof rawImages === 'string') {
      return rawImages
        .split(',')
        .map((item) => getImageUrl(item))
        .filter(Boolean);
    }
    return [];
  })();
  const couponDiscount = calculateDiscountFromCoupon(appliedCoupon, estimate.estimatedTotal);
  const finalEstimateAfterCoupon = estimate.estimatedTotal - couponDiscount;

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div
              className="relative overflow-hidden rounded-2xl shadow-lg cursor-zoom-in"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleImageMouseMove}
            >
              <img
                src={imageList[selectedImage] || getImageUrl(product.images || product.image || product.ImageURL)}
                alt={product.name}
                className="w-full h-[500px] object-cover"
              />
              {isZoomed && (
                <div
                  ref={zoomRef}
                  className="absolute top-0 left-0 w-full h-full bg-cover pointer-events-none"
                  style={{
                    backgroundImage: `url(${imageList[selectedImage] || getImageUrl(product.images || product.image || product.ImageURL)})`,
                    backgroundSize: '200%',
                  }}
                />
              )}
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {imageList.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === i ? 'border-gold' : 'border-transparent hover:border-gold/50'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    className="w-full h-24 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Link to="/products" className="text-gold hover:underline mb-4 inline-block">
              ← Back to Products
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-6 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Price Breakdown</h3>
              <div className="space-y-4">
                {product.purity !== '925' && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">
                      {estimate.purityLabel} ({estimate.weight}g × ₹{Math.round(estimate.rate).toLocaleString()}/gm)
                    </span>
                    <span className="font-semibold text-gray-800">₹{Math.round(estimate.metalValue).toLocaleString()}</span>
                  </div>
                )}
                {estimate.metal === 'silver' && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">
                      Silver ({estimate.weight}g × ₹{Math.round(estimate.rate).toLocaleString()}/gm)
                    </span>
                    <span className="font-semibold text-gray-800">₹{Math.round(estimate.metalValue).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Wastage ({estimate.wastagePercentage}%)</span>
                  <span className="font-semibold text-orange-600">₹{Math.round(estimate.wastageAmount).toLocaleString()}</span>
                </div>
                {estimate.diamondPrice > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Diamonds</span>
                    <span className="font-semibold text-blue-600">₹{estimate.diamondPrice.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Making Charges ({Math.round(estimate.weight)}g × ₹{Math.round(estimate.makingChargePerGram).toLocaleString()}/gm + fixed)</span>
                  <span className="font-semibold text-purple-600">₹{Math.round(estimate.makingChargesAmount).toLocaleString()}</span>
                </div>
                {estimate.fixedMakingCharge > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Fixed Making Charge</span>
                    <span className="font-semibold text-purple-600">₹{Math.round(estimate.fixedMakingCharge).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Estimated Metal + Making Value</span>
                  <span className="font-semibold text-gray-800">₹{Math.round(estimate.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 mt-2">
                  <span className="text-gray-800 font-bold text-lg">Subtotal</span>
                  <span className="font-bold text-gray-900 text-lg">₹{Math.round(estimate.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-green-700 font-semibold">CGST + SGST ({estimate.gstRate}%)</span>
                  <span className="font-semibold text-green-700">₹{Math.round(estimate.gstAmount).toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-green-700 font-semibold">Coupon Discount ({appliedCoupon?.code})</span>
                    <span className="font-semibold text-green-700">-₹{Math.round(couponDiscount).toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center border-t-2 border-gray-400 pt-4 mt-4">
                <span className="text-2xl font-bold text-gray-900">Estimated Bill</span>
                <span className="text-3xl font-bold text-gold">₹{Math.round(finalEstimateAfterCoupon).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
            <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-gray-100 rounded-xl">
              <div>
                <span className="text-gray-500 text-sm">Item Code</span>
                <p className="font-semibold">{product.item_code || 'Not added'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">HUID Hallmark</span>
                <p className="font-semibold">{product.huid_hallmark || 'Not added'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Material</span>
                <p className="font-semibold">{product.material || 'Gold'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Weight</span>
                <p className="font-semibold">{product.weight}g</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Purity</span>
                <p className="font-semibold">{product.purity}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Category</span>
                <p className="font-semibold">{product.category_name || 'General'}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  addToCart({
                    ...product,
                    image: imageList[0] || getImageUrl(product.images || product.image || product.ImageURL),
                    estimated_price: Math.round(estimate.estimatedTotal),
                    rate_per_gram: Math.round(estimate.rate),
                    purity_label: estimate.purityLabel,
                  });
                  toast.success('Added to cart!');
                }}
                className="flex-1 bg-black text-white py-4 rounded-xl font-semibold text-lg hover:bg-gold hover:text-black transition shadow-lg hover:shadow-xl"
              >
                Add to Cart
              </button>
              <button
                onClick={() => {
                  addToWishlist({
                    ...product,
                    image: imageList[0] || getImageUrl(product.images || product.image || product.ImageURL),
                    estimated_price: Math.round(estimate.estimatedTotal),
                    rate_per_gram: Math.round(estimate.rate),
                    purity_label: estimate.purityLabel,
                  });
                  toast.success('Added to wishlist!');
                }}
                aria-label="Add to wishlist"
                className="p-4 border border-gray-300 rounded-xl hover:border-gold transition hover:bg-gold/10"
              >
                <Heart size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
