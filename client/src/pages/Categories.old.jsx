import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Categories = () => {
  const categories = [
    {
      id: 1,
      name: 'Gold',
      slug: 'gold',
      image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"400\"%3E%3Cdefs%3E%3ClinearGradient id=\"gold1\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%239D7E2A;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23FFD700;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23gold1)\" width=\"600\" height=\"400\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"64\" fill=\"white\"%3E🥇%3C/text%3E%3C/svg%3E',
      description: 'Timeless elegance in pure 22k and 24k gold',
      products: 120
    },
    {
      id: 2,
      name: 'Diamond',
      slug: 'diamond',
      image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"400\"%3E%3Cdefs%3E%3ClinearGradient id=\"diamond1\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%23E0E7FF;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23C7D2FE;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23diamond1)\" width=\"600\" height=\"400\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"64\" fill=\"%239D7E2A\"%3E💎%3C/text%3E%3C/svg%3E',
      description: 'Sparkling brilliance with certified diamonds',
      products: 85
    },
    {
      id: 3,
      name: 'Silver',
      slug: 'silver',
      image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"400\"%3E%3Cdefs%3E%3ClinearGradient id=\"silver1\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%23C0C0C0;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23E8E8E8;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23silver1)\" width=\"600\" height=\"400\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"64\" fill=\"%23666\"%3E🥈%3C/text%3E%3C/svg%3E',
      description: 'Elegant silver jewellery for everyday wear',
      products: 200
    },
    {
      id: 4,
      name: 'Platinum',
      slug: 'platinum',
      image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"400\"%3E%3Cdefs%3E%3ClinearGradient id=\"platinum1\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%23E5E4E2;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23BFC1C2;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23platinum1)\" width=\"600\" height=\"400\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"64\" fill=\"%23444\"%3E✨%3C/text%3E%3C/svg%3E',
      description: 'Premium platinum for the discerning',
      products: 45
    },
    {
      id: 5,
      name: 'Rings',
      slug: 'rings',
      image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"400\"%3E%3Cdefs%3E%3ClinearGradient id=\"rings1\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%239D7E2A;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23c4a35a;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23rings1)\" width=\"600\" height=\"400\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"64\" fill=\"white\"%3E💍%3C/text%3E%3C/svg%3E',
      description: 'From engagement to fashion rings',
      products: 150
    },
    {
      id: 6,
      name: 'Necklaces',
      slug: 'necklaces',
      image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"400\"%3E%3Cdefs%3E%3ClinearGradient id=\"necklace1\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%23D4AF37;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%239D7E2A;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23necklace1)\" width=\"600\" height=\"400\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"64\" fill=\"white\"%3E📿%3C/text%3E%3C/svg%3E',
      description: 'Statement pieces and delicate chains',
      products: 110
    },
    {
      id: 7,
      name: 'Earrings',
      slug: 'earrings',
      image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"400\"%3E%3Cdefs%3E%3ClinearGradient id=\"earring1\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%23FFB6C1;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23FF69B4;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23earring1)\" width=\"600\" height=\"400\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"64\" fill=\"white\"%3E💫%3C/text%3E%3C/svg%3E',
      description: 'Studs, drops, and chandelier earrings',
      products: 180
    },
    {
      id: 8,
      name: 'Bangles',
      slug: 'bangles',
      image: 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"400\"%3E%3Cdefs%3E%3ClinearGradient id=\"bangle1\" x1=\"0%25\" y1=\"0%25\" x2=\"100%25\" y2=\"100%25\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%239D7E2A;stop-opacity:1\" /%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23DEB887;stop-opacity:1\" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=\"url(%23bangle1)\" width=\"600\" height=\"400\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"64\" fill=\"white\"%3E⚜️%3C/text%3E%3C/svg%3E',
      description: 'Traditional and modern bangles',
      products: 95
    }
  ];

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
                    src={category.image || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop'}
                    alt={category.name}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop';
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
