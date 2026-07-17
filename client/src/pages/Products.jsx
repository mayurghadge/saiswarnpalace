import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useGoldRate } from '../contexts/GoldRateContext';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE =
  import.meta.env.VITE_API_URL || '/api';
const CLOUDINARY_FALLBACK = 'https://res.cloudinary.com/dayhebhj7/image/upload/f_auto,q_auto,w_800,h_800,c_fill/v1780553055/IMG-20230905-WA0018_khsrzn.jpg';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || '');
  const { addToCart, addToWishlist } = useCart();
  const { calculateProductEstimate } = useGoldRate();

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

  const fetchProducts = async () => {
    try {
      const url = new URL(`${API_BASE}/products`, window.location.origin);
      if (selectedCategory) {
        url.searchParams.set('category', selectedCategory);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory]);
  
  useEffect(() => {
    if (categoryParam !== selectedCategory) {
      const newParams = new URLSearchParams(searchParams);
      if (selectedCategory) {
        newParams.set('category', selectedCategory);
      } else {
        newParams.delete('category');
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [selectedCategory]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="py-12 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Our Products</h1>
        
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg flex-1 max-w-md"
          />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden transition hover:shadow-xl hover:-translate-y-1">
                {(() => {
                  const estimate = calculateProductEstimate(product);
                  return (
                    <>
                      <img 
                        src={getImageUrl(product.images || product.image || product.ImageURL)} 
                        alt={product.name} 
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          e.target.src = CLOUDINARY_FALLBACK;
                        }}
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                        <div className="mb-2 flex flex-wrap gap-2 text-xs">
                          {product.item_code ? <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-700">Code: {product.item_code}</span> : null}
                          {product.huid_hallmark ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">HUID: {product.huid_hallmark}</span> : null}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                        <div className="mb-4 rounded-lg bg-stone-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Estimated Bill</p>
                          <p className="text-yellow-700 text-xl font-bold">
                            ₹{Math.round(estimate.estimatedTotal).toLocaleString()}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-xs text-stone-600">
                            <span>{estimate.purityLabel} Rate: ₹{Math.round(estimate.rate).toLocaleString()}/g</span>
                            <span>Metal Value: ₹{Math.round(estimate.metalValue).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link 
                            to={`/products/${product.id}`} 
                            className="flex-1 border border-black text-black py-2 rounded text-center hover:bg-black hover:text-white transition"
                          >
                            View
                          </Link>
                          <button 
                            onClick={() => {
                                    addToCart({
                                      ...product,
                                      image: getImageUrl(product.images || product.image || product.ImageURL),
                                      estimated_price: Math.round(estimate.estimatedTotal),
                                      rate_per_gram: Math.round(estimate.rate),
                                      purity_label: estimate.purityLabel,
                                    });
                              toast.success('Added to cart!');
                            }}
                            className="flex-1 bg-black text-white py-2 rounded hover:bg-yellow-700 hover:text-white transition"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => {
                              addToWishlist({
                                ...product,
                                image: getImageUrl(product.images || product.image || product.ImageURL),
                                estimated_price: Math.round(estimate.estimatedTotal),
                                rate_per_gram: Math.round(estimate.rate),
                                purity_label: estimate.purityLabel,
                              });
                              toast.success('Added to wishlist!');
                            }}
                            aria-label={`Add ${product.name} to wishlist`}
                            className="p-2 border border-gray-300 rounded hover:border-[#9D7E2A] hover:text-[#9D7E2A] transition"
                          >
                            <Heart size={20} />
                          </button>
                        </div>
                    </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
