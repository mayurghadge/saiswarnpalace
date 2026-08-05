import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { GoldRateProvider } from './contexts/GoldRateContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <GoldRateProvider>
          <Router>
            <AppRoutes />
            <Toaster position="top-center" />
          </Router>
        </GoldRateProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
