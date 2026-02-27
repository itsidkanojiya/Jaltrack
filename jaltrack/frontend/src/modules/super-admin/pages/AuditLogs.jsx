import { useState, useEffect } from 'react';

const API = '/api/super-admin';
const token = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${token()}` });

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set('action', actionFilter);
    if (roleFilter) params.set('role', roleFilter);
    params.set('limit', '100');
    fetch(`${API}/logs?${params}`, { headers: hdrs() })
      .then((r) => r.json())
      .then((d) => setLogs(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [actionFilter, roleFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-5">Audit Logs</h2>

      <div className="flex gap-3 mb-5">
        <input value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} placeholder="Filter by action..." className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="delivery_boy">Delivery Boy</option>
          <option value="client">Client</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="px-4 py-3 text-left font-semibold">Time</th>
                <th className="px-4 py-3 text-left font-semibold">User</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">Business</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
                <th className="px-4 py-3 text-left font-semibold">Detail</th>
                <th className="px-4 py-3 text-left font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>}
              {!loading && logs.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400">No logs found</td></tr>}
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{l.created_at ? new Date(l.created_at).toLocaleString() : ''}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{l.user_name || '—'}</td>
                  <td className="px-4 py-2.5"><RoleBadge role={l.user_role} /></td>
                  <td className="px-4 py-2.5 text-slate-600">{l.business_name || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-700 font-mono text-xs">{l.action}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[200px] truncate">{l.detail || ''}</td>
                  <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{l.ip_address || ''}</td>
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
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors[role] || 'bg-slate-100 text-slate-600'}`}>{role || '—'}</span>;
}
