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
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [goldRateMenuOpen, setGoldRateMenuOpen] = useState(false);

  const categories = {
    'All Jewellery': {
      categories: ['All Jewellery', 'Gold', 'Diamond', 'Rings', 'Earrings', 'Wedding Jewellery', 'Jewellery Purchase Plan', 'Gifting'],
      gender: ['Women', 'Men', 'Kids', 'Unisex'],
      price: ['< 5000', '5K - 10K', '10K - 20K', '20K - 30K', '30K - 40K', '40K - 50K', '> 50K']
    },
    'Gold': {
      categories: ['Earring', 'Pendant', 'Finger Ring', 'Other Categories', 'Gold Coin'],
      earring: ['Jhumka', 'Stud', 'Hanging', 'Others'],
      pendant: ['Daily Wear', 'Party', 'Work Wear', 'Traditional'],
      fingerRing: ['Engagement Rings', 'Party', 'Work Wear', 'Daily Wear']
    },
    'Diamond': {
      categories: ['Earring', 'Pendant', 'Finger Ring', 'Other Categories', 'Metal Color'],
      earring: ['Stud', 'Hanging', 'Jhumka'],
      pendant: ['Daily Wear', 'Party', 'Traditional'],
      fingerRing: ['Engagement Rings', 'Solitaires', 'Casual'],
      metalColor: ['Yellow Gold', 'Rose Gold', 'Two Tone']
    },
    'Rings': {
      gold: ['Engagement Rings', 'Party', 'Work Wear', 'Daily Wear'],
      diamond: ['Engagement Rings', 'Solitaires', 'Casual']
    },
    'Earrings': {
      gold: ['Jhumka', 'Stud', 'Hanging', 'Others'],
      diamond: ['Stud', 'Hanging', 'Jhumka']
    }
  };

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

      {/* Navigation Bar */}
      <nav className="hidden md:block border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 h-14">
            {Object.keys(categories).map((item) => (
              <div
                key={item}
                className="relative group"
                onMouseEnter={() => setActiveMegaMenu(item)}
                onMouseLeave={() => setActiveMegaMenu(null)}
              >
                <Link 
                  to={item === 'All Jewellery' ? '/products' : '/categories'}
                  className="text-gray-800 font-medium hover:text-gold transition flex items-center gap-1 py-4"
                >
                  {item}
                  <ChevronDown size={16} />
                </Link>
                {/* Mega Menu */}
                {activeMegaMenu === item && (
                  <div className="absolute top-full left-0 w-[800px] bg-white shadow-2xl border-t-4 border-gold p-8 z-50">
                    <div className="grid grid-cols-4 gap-8">
                      {categories[item].categories && (
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">CATEGORIES</h4>
                          <ul className="space-y-2">
                            {categories[item].categories.map((cat) => (
                              <li key={cat}>
                                <Link to="/products" className="text-gray-600 hover:text-gold transition">{cat}</Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {categories[item].gender && (
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">GENDER</h4>
                          <ul className="space-y-2">
                            {categories[item].gender.map((g) => (
                              <li key={g}>
                                <Link to="/products" className="text-gray-600 hover:text-gold transition">{g}</Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {categories[item].price && (
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">PRICE</h4>
                          <ul className="space-y-2">
                            {categories[item].price.map((p) => (
                              <li key={p}>
                                <Link to="/products" className="text-gray-600 hover:text-gold transition">{p}</Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {categories[item].earring && (
                        <>
                          <div>
                            <h4 className="font-bold text-gray-800 mb-4">EARRING</h4>
                            <ul className="space-y-2">
                              {categories[item].earring.map((e) => (
                                <li key={e}>
                                  <Link to="/products" className="text-gray-600 hover:text-gold transition">{e}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 mb-4">PENDANT</h4>
                            <ul className="space-y-2">
                              {categories[item].pendant.map((p) => (
                                <li key={p}>
                                  <Link to="/products" className="text-gray-600 hover:text-gold transition">{p}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 mb-4">FINGER RING</h4>
                            <ul className="space-y-2">
                              {categories[item].fingerRing.map((fr) => (
                                <li key={fr}>
                                  <Link to="/products" className="text-gray-600 hover:text-gold transition">{fr}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                      {categories[item].gold && (
                        <>
                          <div>
                            <h4 className="font-bold text-gray-800 mb-4">GOLD</h4>
                            <ul className="space-y-2">
                              {categories[item].gold.map((g) => (
                                <li key={g}>
                                  <Link to="/products" className="text-gray-600 hover:text-gold transition">{g}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 mb-4">DIAMOND</h4>
                            <ul className="space-y-2">
                              {categories[item].diamond.map((d) => (
                                <li key={d}>
                                  <Link to="/products" className="text-gray-600 hover:text-gold transition">{d}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                      {categories[item].metalColor && (
                        <>
                          <div>
                            <h4 className="font-bold text-gray-800 mb-4">OTHER CATEGORIES</h4>
                            <ul className="space-y-2">
                              {['Mangalsutra', 'Necklace', 'Nose Pin', 'Neckwear Set', 'Bangle', 'Bracelet', 'Pendant And Earring Set', 'Maang Tikka'].map((oc) => (
                                <li key={oc}>
                                  <Link to="/products" className="text-gray-600 hover:text-gold transition">{oc}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 mb-4">METAL COLOR</h4>
                            <ul className="space-y-2">
                              {categories[item].metalColor.map((mc) => (
                                <li key={mc}>
                                  <Link to="/products" className="text-gray-600 hover:text-gold transition">{mc}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

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
              {Object.keys(categories).map((item) => (
                <Link
                  key={item}
                  to="/products"
                  className="block py-2 text-gray-800 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
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
