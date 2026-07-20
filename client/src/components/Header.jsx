import MegaMenu from "./MegaMenu";
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useGoldRate } from '../contexts/GoldRateContext';
import { ShoppingCart, Heart, Search, Menu, ChevronDown, MapPin, X } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { goldRate18k, goldRate22k, goldRate24k, silverRate } = useGoldRate();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [goldRateMenuOpen, setGoldRateMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white text-black sticky top-0 z-50 shadow-md">
      {/* Top Banner - Gold Rate */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-sm">
          <div 
            className="flex items-center gap-2 relative"
            onMouseEnter={() => setGoldRateMenuOpen(true)}
            onMouseLeave={() => setGoldRateMenuOpen(false)}
          >
            <span className="text-gray-700 font-medium"><span className="sm:hidden">22K/g</span><span className="hidden sm:inline">Today's Rate : Gold Price 22KT/g</span></span>
            <span className="text-[#9D7E2A] font-bold">₹{Number(goldRate22k || 0).toLocaleString()}</span>
            <ChevronDown size={14} className="text-gray-500" />
            
            {/* Gold Rate Dropdown */}
            {goldRateMenuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white shadow-lg border border-gray-200 min-w-[250px] z-50">
                <div className="py-2">
                  <div className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between">
                    <span className="text-gray-700">Gold Price 22KT/1g</span>
                    <span className="text-[#9D7E2A] font-bold">₹{Number(goldRate22k || 0).toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between">
                    <span className="text-gray-700">Gold Price 24KT/1g</span>
                    <span className="text-[#9D7E2A] font-bold">₹{Number(goldRate24k || 0).toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between">
                    <span className="text-gray-700">Gold Price 18KT/1g</span>
                    <span className="text-[#9D7E2A] font-bold">₹{Number(goldRate18k || 0).toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between">
                    <span className="text-gray-700">Silver Price</span>
                    <span className="text-[#9D7E2A] font-bold">₹{Number(silverRate || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="https://www.saiswarnpalace.com/" className="hidden sm:block text-gray-700 font-medium hover:text-gold transition">PURCHASE PLAN PAYMENT</Link>
            {/* My Account Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setAccountMenuOpen(true)}
              onMouseLeave={() => setAccountMenuOpen(false)}
            >
              <button onClick={() => setAccountMenuOpen(!accountMenuOpen)} className="text-gray-700 font-medium hover:text-gold transition flex items-center gap-1">
                {user ? 'My Account' : 'ACCOUNT'} <ChevronDown size={14} />
              </button>
              {accountMenuOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white shadow-lg border border-gray-200 min-w-[200px] z-50">
                  {user ? (
                    <ul className="py-2">
                      <li><Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">My Account</Link></li>
                      <li><Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">My Orders</Link></li>
                      <li><Link to="/wishlist" className="block px-4 py-2 hover:bg-gray-100">My Wish List</Link></li>
                      <li><button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100">Sign Out</button></li>
                    </ul>
                  ) : (
                    <ul className="py-2">
                      <li><Link to="/login" className="block px-4 py-2 hover:bg-gray-100">Login</Link></li>
                      <li><Link to="/register" className="block px-4 py-2 hover:bg-gray-100">Register</Link></li>
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 md:h-24">
            {/* Logo 1 */}
            <Link to="/" className="flex items-center gap-2">
              <img src="https://res.cloudinary.com/dayhebhj7/image/upload/v1782470637/ssp_logo_jub3xa.png" alt="SAI SWARN PALACE Logo" className="h-12 sm:h-16 md:h-20 w-auto" />
            </Link>
            {/* Logo 2 */}
            <Link to="/" className="hidden lg:flex items-center gap-2">
              <div className="text-4xl font-bold text-gold" style={{ fontFamily: 'Georgia, serif' }}>SAI SWARN PALACE</div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8 relative">
              <input
                type="text"
                placeholder="Search for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border-b-2 border-gray-300 focus:border-gold focus:outline-none text-gray-700"
              />
              <button type="submit" className="absolute right-0 bottom-2 text-gold">
                <Search size={24} />
              </button>
            </form>

            {/* Icons Section */}
            <div className="flex items-center gap-3 sm:gap-6">
              <button className="hidden sm:flex flex-col items-center gap-1 hover:text-gold transition">
                <MapPin size={24} />
                <span className="text-xs text-gray-600">Stores</span>
              </button>
              <Link to="/wishlist" className="hidden sm:flex flex-col items-center gap-1 hover:text-gold transition">
                <Heart size={24} />
                <span className="text-xs text-gray-600">My Wishlist</span>
              </Link>
              <Link to="/cart" className="flex flex-col items-center gap-1 hover:text-gold transition relative">
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 right-0 bg-gold text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
                <span className="hidden sm:block text-xs text-gray-600">My Cart</span>
              </Link>
              <button 
                className="md:hidden flex flex-col items-center gap-1"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop category navigation */}
      <div className="hidden md:block border-b border-gray-200">
        <MegaMenu />
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="p-4">
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="text"
                placeholder="Search for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded"
              />
            </form>
            <nav className="space-y-4">
              {[
                { label: 'All Jewellery', to: '/products' },
                { label: 'Gold', to: '/products?material=Gold' },
                { label: 'Diamond', to: '/products?material=Diamond' },
                { label: 'Rings', to: '/products?category=Rings' },
                { label: 'Earrings', to: '/products?category=Earrings' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block py-2 text-gray-800 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;