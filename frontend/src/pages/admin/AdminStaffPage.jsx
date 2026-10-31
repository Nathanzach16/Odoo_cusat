import { useState } from 'react';

export default function AdminStaffPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/admin/add-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': localStorage.getItem('role') || 'ADMIN', // Header passed to pass backend role checks
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to add staff');

      setStatusMsg({ type: 'success', text: data.message });
      setFormData({ email: '', password: '' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Staff Management</h1>

      {statusMsg.text && (
        <div className={`p-4 rounded-md mb-4 text-sm ${statusMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleAddStaff} className="bg-white p-6 rounded-lg shadow border space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Add New Staff Member</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Staff Email</label>
          <input
            type="email"
            required
            className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Staff Password</label>
          <input
            type="password"
            required
            className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-medium text-sm transition-colors"
        >
          Create Staff Account
        </button>
      </form>
    </div>
  );
}