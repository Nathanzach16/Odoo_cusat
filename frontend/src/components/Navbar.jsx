import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role') || 'USER';
  const email = localStorage.getItem('email') || 'user@example.com';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
      case 'ADMIN': return 'badge-admin';
      case 'STAFF': return 'badge-staff';
      default: return 'badge-user';
    }
  };

  return (
    <nav className="glass-card mb-8 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
          O
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-900 tracking-tight leading-none">Odoo ERP Engine</h1>
          <span className="text-xs text-indigo-600 font-medium">Auth & RBAC Module</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/dashboard"
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === '/dashboard'
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Dashboard
        </Link>
        {role === 'ADMIN' && (
          <Link
            to="/admin/staff"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/admin/staff'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Staff Directory
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-gray-800">{email}</p>
          <span className={getRoleBadgeClass(role)}>{role}</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}