import { Navigate, Outlet } from 'react-router-dom';

const getAllowedAdminEmails = () => (
  (import.meta.env.VITE_ALLOWED_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map((email) => String(email || '').trim().toLowerCase())
    .filter(Boolean)
);

const AdminRoute = () => {
  const adminToken = localStorage.getItem('adminToken');
  const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
  const adminEmail = (localStorage.getItem('adminEmail') || '').toLowerCase();
  const allowedAdmins = getAllowedAdminEmails();
  const isAuthorized = !!adminToken && adminLoggedIn && (!allowedAdmins.length || allowedAdmins.includes(adminEmail));

  if (!isAuthorized) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('token');
    return <Navigate to="/admin-login" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
