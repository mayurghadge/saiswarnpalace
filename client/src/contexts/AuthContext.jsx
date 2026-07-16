import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

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
    if (message.includes('failed to fetch') || message.includes('network')) {
      return 'Unable to reach the backend API. Please configure VITE_API_URL to the live backend host.';
    }
    if (message.includes('database connection unavailable') || message.includes('azure sql')) {
      return 'The database is currently unavailable. Please contact the site administrator to restore Azure SQL access.';
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setPendingRegistration({ email, otp: data.otp });
      toast.success(`Registration successful! OTP: ${data.otp}`);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
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

      const data = await response.json();
      
      if (!response.ok) {
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const { token, user } = data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      toast.success('Login successful!');
      
      return { user, token };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(getFriendlyErrorMessage(error, 'Invalid credentials'));
      throw error;
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
