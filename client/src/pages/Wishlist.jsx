import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Trash2, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Wishlist = () => {
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState([]);

  // Demo wishlist data
  const demoWishlist = [
    { id: 1, name: 'Gold Necklace', price: 45000, image: 'https://res.cloudinary.com/dayhebhj7/image/upload/f_auto,q_auto,w_600,h_600,c_fill/v1780295778/chain_nxgghq.jpg' },
    { id: 2, name: 'Diamond Ring', price: 89000, image: 'https://res.cloudinary.com/dayhebhj7/image/upload/f_auto,q_auto,w_600,h_600,c_fill/v1780553055/IMG-20230905-WA0018_khsrzn.jpg' },
    { id: 3, name: 'Silver Earrings', price: 5000, image: 'https://res.cloudinary.com/dayhebhj7/image/fetch/f_auto,q_auto,w_600,h_600,c_fill/https://images.unsplash.com/photo-1602028915047-37269d1a73f7' }
  ];

  useEffect(() => {
    // In real app, fetch from API
    setWishlist(demoWishlist);
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product.id);
    toast.success('Added to cart!');
  };

  const handleRemove = (id) => {
    setWishlist(wishlist.filter(item => item.id !== id));
    toast.success('Removed from wishlist!');
  };

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">My Wishlist</h1>
        {wishlist.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <h2 className="text-2xl font-semibold mb-4 text-gray-600">Your wishlist is empty</h2>
            <Link to="/products" className="inline-block bg-gold text-black px-8 py-3 rounded-lg font-semibold hover:bg-gold-light transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {wishlist.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <Link to={`/products/${product.id}`}>
                  <img src={product.image} alt={product.name} className="w-full h-56 object-cover" />
                </Link>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    <Link to={`/products/${product.id}`} className="hover:text-gold">{product.name}</Link>
                  </h3>
                  <p className="text-gold text-xl font-bold mb-4">₹{product.price.toLocaleString()}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 bg-black text-white py-2 rounded hover:bg-gold hover:text-black transition flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="p-2 border border-red-300 text-red-500 rounded hover:bg-red-50 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
