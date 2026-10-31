import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/auth/AuthPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import { RequireAuth } from './components/guards/RequireAuth';

function Dashboard() {
  const role = localStorage.getItem('role');
  const email = localStorage.getItem('email');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome, {email}!</h1>
      <p className="mt-2 text-gray-600">Your role: <span className="font-semibold text-blue-600">{role}</span></p>
      <button
        onClick={() => { localStorage.clear(); window.location.href = '/auth/login'; }}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md text-sm"
      >
        Logout
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to login */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />

        {/* Public Auth Route (T07) */}
        <Route path="/auth/login" element={<AuthPage />} />

        {/* Protected User Dashboard */}
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Protected Admin Only Route (T08 & T09) */}
        <Route element={<RequireAuth allowedRoles={['ADMIN']} />}>
          <Route path="/admin/staff" element={<AdminStaffPage />} />
        </Route>

        {/* Unauthorized Fallback */}
        <Route path="/unauthorized" element={
          <div className="p-8 text-center text-red-600 font-semibold">
            Access Denied: You do not have permission to view this page.
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}