import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthPage from './pages/auth/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import Navbar from './components/Navbar';
import { RequireAuth } from './components/guards/RequireAuth';

function AppLayout() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <Navbar />
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to frontend login view */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Login/Signup View */}
        <Route path="/login" element={<AuthPage />} />

        {/* Authenticated Protected Routes */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Admin Restricted Route */}
            <Route element={<RequireAuth allowedRoles={['ADMIN']} />}>
              <Route path="/admin/staff" element={<AdminStaffPage />} />
            </Route>
          </Route>
        </Route>

        {/* Access Denied Fallback View */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                  !
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                <p className="text-sm text-gray-600">
                  Your current account role does not have permission to access this route.
                </p>
                <button
                  onClick={() => (window.location.href = '/dashboard')}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md text-sm"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}