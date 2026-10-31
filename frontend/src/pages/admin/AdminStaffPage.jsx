import { useState } from 'react';

export default function AdminStaffPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [staffList, setStaffList] = useState([
    { id: 1, email: 'admin@odoo.com', role: 'ADMIN', status: 'Active' },
    { id: 2, email: 'staff1@odoo.com', role: 'STAFF', status: 'Active' },
    { id: 3, email: 'user@test.com', role: 'USER', status: 'Active' },
  ]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/admin/add-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': localStorage.getItem('role') || 'ADMIN',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to create staff account');

      setStatusMsg({ type: 'success', text: data.message || 'Staff account created successfully!' });
      setStaffList((prev) => [
        ...prev,
        { id: prev.length + 1, email: formData.email, role: 'STAFF', status: 'Active' },
      ]);
      setFormData({ email: '', password: '' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const filteredStaff = staffList.filter((s) =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Control Center</h2>
          <p className="text-sm text-gray-600">Provision staff credentials and manage user permissions.</p>
        </div>
        <span className="badge-admin text-xs font-bold px-3 py-1">Restricted Route</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-1 h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Add New Staff</h3>

          {statusMsg.text && (
            <div className={`p-3 rounded-md mb-4 text-xs font-medium ${statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {statusMsg.text}
            </div>
          )}

          <form onSubmit={handleAddStaff} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Staff Email</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="staff@odoo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-sm transition-colors shadow-sm"
            >
              Provision Account
            </button>
          </form>
        </div>

        <div className="glass-card p-6 lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <h3 className="text-lg font-bold text-gray-900">User & Staff Directory</h3>
            <input
              type="text"
              placeholder="Filter by email..."
              className="px-3 py-1.5 border rounded-lg text-xs w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th className="p-3">User Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStaff.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-medium text-gray-900">{person.email}</td>
                    <td className="p-3">
                      <span className={person.role === 'ADMIN' ? 'badge-admin' : person.role === 'STAFF' ? 'badge-staff' : 'badge-user'}>
                        {person.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {person.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}