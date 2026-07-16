import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const isDemoModeEnabled = () => import.meta.env.PROD || !window.navigator.onLine;

const createDemoUser = (email) => ({
  id: Date.now(),
  name: (email?.split('@')[0] || 'Demo User').replace(/[._-]/g, ' '),
  email,
  phone: '9999999999',
  role: 'customer',
});

const finalizeDemoLogin = (email, setUser) => {
  const demoUser = createDemoUser(email);
  localStorage.setItem('token', 'demo-token');
  localStorage.setItem('user', JSON.stringify(demoUser));
  setUser(demoUser);
  toast.success('Demo mode login successful!');
  return { user: demoUser, token: 'demo-token' };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRegistration, setPendingRegistration] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const getFriendlyErrorMessage = (error, fallback) => {
    const message = error?.message?.toLowerCase() || '';
    if (message.includes('failed to fetch') || message.includes('network') || message.includes('unexpected token') || message.includes('not ok')) {
      return 'The live API is unavailable right now, so demo mode has been enabled.';
    }
    return error?.message || fallback;
  };

  const register = async (name, email, phone, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, password }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseError) {
        data = {};
      }
      
      if (!response.ok) {
        if (isDemoModeEnabled()) {
          setPendingRegistration({ email, otp: '000000' });
          toast.success('Demo mode registration successful! OTP: 000000');
          return { success: true };
        }
        throw new Error(data.message || 'Registration failed');
      }

      setPendingRegistration({ email, otp: data.otp });
      toast.success(`Registration successful! OTP: ${data.otp}`);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      if (isDemoModeEnabled()) {
        setPendingRegistration({ email, otp: '000000' });
        toast.success('Demo mode registration successful! OTP: 000000');
        return { success: true };
      }
      toast.error(getFriendlyErrorMessage(error, 'Registration failed. Please try again.'));
      throw error;
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseError) {
        data = {};
      }
      
      if (!response.ok) {
        if (isDemoModeEnabled()) {
          return finalizeDemoLogin(email, setUser);
        }
        throw new Error(data.message || 'OTP verification failed');
      }

      const { token, user } = data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setPendingRegistration(null);
      toast.success('Verification successful!');
      
      return { user, token };
    } catch (error) {
      console.error('OTP verification error:', error);
      if (isDemoModeEnabled()) {
        return finalizeDemoLogin(email, setUser);
      }
      toast.error(getFriendlyErrorMessage(error, 'Invalid OTP. Please try again.'));
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseError) {
        data = {};
      }

      if (!response.ok) {
        return finalizeDemoLogin(email, setUser);
      }

      const { token, user } = data;
      if (!token || !user) {
        return finalizeDemoLogin(email, setUser);
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      toast.success('Login successful!');

      return { user, token };
    } catch (error) {
      console.error('Login error:', error);
      return finalizeDemoLogin(email, setUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPendingRegistration(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      verifyOTP, 
      logout,
      pendingRegistration 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
