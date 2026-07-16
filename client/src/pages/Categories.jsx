import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
const CLOUDINARY_FALLBACK = 'https://res.cloudinary.com/dayhebhj7/image/upload/f_auto,q_auto,w_1200,h_800,c_fill/v1780295778/chain_nxgghq.jpg';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/categories`);
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Shop by Category</h1>
          <p className="text-xl text-gray-600">Explore our exquisite collections</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Link to={`/products?category=${category.id}`} className="block">
                  <div className="relative overflow-hidden rounded-2xl">
                    <img
                      src={getImageUrl(category.image || category.ImageURL || category.images)}
                      alt={category.name}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = CLOUDINARY_FALLBACK;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                      <p className="text-gray-200 text-sm mb-3">{category.description || 'Beautiful jewellery collection'}</p>
                      <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm">
                        View Collection
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-gold to-yellow-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Looking for something specific?</h2>
            <p className="text-lg mb-6 opacity-90">Contact our expert jewellery consultants for personalized recommendations</p>
            <button className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
