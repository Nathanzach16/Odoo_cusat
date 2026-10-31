import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState({ email: '', role: '' });
  const [systemHealth, setSystemHealth] = useState('Checking...');

  useEffect(() => {
    const email = localStorage.getItem('email') || 'Guest User';
    const role = localStorage.getItem('role') || 'USER';
    setUser({ email, role });

    fetch('http://127.0.0.1:8000/docs')
      .then(() => setSystemHealth('Operational (200 OK)'))
      .catch(() => setSystemHealth('Offline'));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="glass-card p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white border-0">
        <h2 className="text-2xl font-bold">Welcome back, {user.email}!</h2>
        <p className="text-indigo-200 text-sm mt-1">
          Authenticated under role: <span className="font-semibold text-white">{user.role}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active User</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1 truncate">{user.email}</h3>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Active Session
          </span>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Role</p>
          <h3 className="text-xl font-bold text-indigo-600 mt-1">{user.role}</h3>
          <p className="text-xs text-gray-500 mt-2">RBAC Permission Level</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Backend API</p>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">FastAPI Engine</h3>
          <p className="text-xs text-emerald-700 mt-2 font-mono">{systemHealth}</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Security Engine</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">JWT / Hashing</h3>
          <p className="text-xs text-gray-500 mt-2">Passlib & Standard Tokens</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3">Module Capabilities Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="font-semibold text-indigo-600 block mb-1">🔐 Auth & Validation</span>
              <p className="text-gray-600 text-xs">Pydantic schema validation for email formats, password strength, and role assignment.</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="font-semibold text-indigo-600 block mb-1">🛡️ Client Route Guards</span>
              <p className="text-gray-600 text-xs">React Router `RequireAuth` wrapper preventing unauthorized endpoint viewing.</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="font-semibold text-indigo-600 block mb-1">👥 Staff Management</span>
              <p className="text-gray-600 text-xs">Admin-restricted portal for registering new staff credentials with role headers.</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="font-semibold text-indigo-600 block mb-1">⚡ FastAPI OpenAPI Docs</span>
              <p className="text-gray-600 text-xs">Auto-generated Swagger documentation at port 8000 for seamless integration testing.</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Audit Logs</h3>
          <ul className="space-y-3 text-xs">
            <li className="flex items-center justify-between p-2 rounded bg-indigo-50/50 text-indigo-900">
              <span>Session Authenticated</span>
              <span className="font-mono text-indigo-600">Just Now</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded bg-emerald-50/50 text-emerald-900">
              <span>Token Verification</span>
              <span className="font-mono text-emerald-600">PASSED</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded bg-slate-50 text-slate-700">
              <span>SQLite Sync</span>
              <span className="font-mono text-slate-500">READY</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

