import { useState, useEffect } from 'react';

const API = '/api/super-admin';
const token = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    fetch(`${API}/users?${params}`, { headers: hdrs() })
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, roleFilter]);

  const resetPassword = async (userId) => {
    if (!confirm('Reset password to Jaltrack@123?')) return;
    const res = await fetch(`${API}/users/${userId}/reset-password`, { method: 'PUT', headers: hdrs() });
    const data = await res.json();
    if (data.success) alert(`Password reset to: ${data.tempPassword}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-5">All Users</h2>

      <div className="flex gap-3 mb-5">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="delivery_boy">Delivery Boy</option>
          <option value="client">Client</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">Business</th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>}
              {!loading && users.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">No users found</td></tr>}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 text-slate-600">{u.business_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{u.phone || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => resetPassword(u.id)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Reset Password">
                      <span className="material-symbols-outlined text-lg text-orange-500">lock_reset</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const colors = { super_admin: 'bg-purple-50 text-purple-700', admin: 'bg-blue-50 text-blue-700', delivery_boy: 'bg-green-50 text-green-700', client: 'bg-orange-50 text-orange-700' };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors[role] || 'bg-slate-100 text-slate-600'}`}>{role}</span>;
}
