import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const adminToken = localStorage.getItem('adminToken');
  const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';

  if (!adminToken || !adminLoggedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
