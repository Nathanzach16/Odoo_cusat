import { Navigate, Outlet } from 'react-router-dom';

// In a real app, you would get this from Context, Redux, or localStorage
// after a successful login.
const useAuth = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role'); 
  return { isAuthenticated: !!token, role };
};

export const RequireAuth = ({ allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();

  // 1. If the user is not logged in at all, kick them to the login page
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // 2. If roles are required, check if the user has the right role
  if (allowedRoles && !allowedRoles.includes(role)) {
    // User is logged in but doesn't have permission (e.g., a Customer trying to access Admin pages)
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. If everything is good, render the protected child components
  return <Outlet />;
};