import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, User, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/admin/login', {
        email: credentials.email,
        password: credentials.password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminLoggedIn', 'true');
      toast.success('Admin login successful!');
      navigate('/admin');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Invalid username or password!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gold rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Login</h1>
          <p className="text-gray-500 mt-2">Sai Swarn Palace - Admin Panel</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                required
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="Enter admin email"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="Enter admin password"
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
            />
            <label htmlFor="showPassword" className="ml-2 text-sm text-gray-600">Show password</label>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gold text-white py-3 rounded-lg font-semibold text-lg hover:bg-yellow-600 transition shadow-lg disabled:opacity-70"
          >
            {isLoading ? 'Logging in...' : 'Login to Admin'}
          </button>
        </form>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p><strong>Email:</strong>admin@saiswarnpalace.com</p>
          <p><strong>Password:</strong> Ssp@277369</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
