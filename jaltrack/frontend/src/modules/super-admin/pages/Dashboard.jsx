import { useState, useEffect } from 'react';
import { API as API_BASE } from '../../../core/apiBase';

const API = `${API_BASE}/super-admin`;
const token = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${token()}` });

const statCards = [
  { key: 'totalBusinesses', label: 'Total Businesses', icon: 'business', color: 'bg-blue-50 text-blue-600' },
  { key: 'activeBusinesses', label: 'Active', icon: 'check_circle', color: 'bg-green-50 text-green-600' },
  { key: 'suspendedBusinesses', label: 'Suspended', icon: 'block', color: 'bg-red-50 text-red-600' },
  { key: 'trialBusinesses', label: 'On Trial', icon: 'hourglass_top', color: 'bg-amber-50 text-amber-600' },
  { key: 'totalCustomers', label: 'Total Customers', icon: 'group', color: 'bg-purple-50 text-purple-600' },
  { key: 'totalDeliveryBoys', label: 'Delivery Boys', icon: 'local_shipping', color: 'bg-cyan-50 text-cyan-600' },
  { key: 'monthlySaasRevenue', label: 'Monthly SaaS Revenue', icon: 'payments', color: 'bg-emerald-50 text-emerald-600', fmt: 'currency' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/dashboard/stats`, { headers: hdrs() }).then((r) => r.json()),
      fetch(`${API}/dashboard/activity?limit=15`, { headers: hdrs() }).then((r) => r.json()),
    ])
      .then(([s, a]) => { setStats(s); setActivity(Array.isArray(a) ? a : []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-sm text-slate-400">Loading...</p></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-5">Platform Overview</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ key, label, icon, color, fmt }) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-lg">{icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {fmt === 'currency' ? `₹${Number(stats[key] || 0).toLocaleString('en-IN')}` : stats[key] ?? 0}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-3">Recent Activity</h3>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="px-4 py-3 text-left font-semibold">Action</th>
                <th className="px-4 py-3 text-left font-semibold">User</th>
                <th className="px-4 py-3 text-left font-semibold">Business</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">IP</th>
                <th className="px-4 py-3 text-left font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activity.length === 0 && (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">No activity yet</td></tr>
              )}
              {activity.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{a.action}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.user}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.business}</td>
                  <td className="px-4 py-2.5"><RoleBadge role={a.role} /></td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{a.ip}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{a.time ? new Date(a.time).toLocaleString() : ''}</td>
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
  const colors = {
    super_admin: 'bg-purple-50 text-purple-700',
    admin: 'bg-blue-50 text-blue-700',
    delivery_boy: 'bg-green-50 text-green-700',
    client: 'bg-orange-50 text-orange-700',
  };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors[role] || 'bg-slate-100 text-slate-600'}`}>{role || '—'}</span>;
}
