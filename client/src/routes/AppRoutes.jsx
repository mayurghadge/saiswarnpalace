import { Routes, Route, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Products from '../pages/Products';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Wishlist from '../pages/Wishlist';
import Categories from '../pages/Categories';
import Checkout from '../pages/Checkout';
import PaymentSuccess from '../pages/PaymentSuccess';
import Profile from '../pages/Profile';
import Orders from '../pages/Orders';
import AdminDashboard from '../pages/AdminDashboard';
import AdminLogin from '../pages/AdminLogin';
import AdminRoute from './AdminRoute';
import PrivateRoute from './PrivateRoute';

function AppRoutes() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname === '/admin' || pathname === '/admin-login';

  return (
    <>
      {!isAdminRoute && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/checkout" element={<PrivateRoute />}>
          <Route path="/checkout" element={<Checkout />} />
        </Route>
        <Route path="/payment-success" element={<PrivateRoute />}>
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Route>
        <Route path="/profile" element={<PrivateRoute />}>
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/orders" element={<PrivateRoute />}>
          <Route path="/orders" element={<Orders />} />
        </Route>
        <Route path="/orders/:id" element={<PrivateRoute />}>
          <Route path="/orders/:id" element={<Orders />} />
        </Route>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  );
}

export default AppRoutes;
