import { useState, useEffect } from 'react';
import { API as API_BASE } from '../../../core/apiBase';

const API = `${API_BASE}/client`;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

export default function ClientDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/dashboard`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Access denied. Your account may not be linked to a customer yet. Please contact your supplier.' : 'Failed to load dashboard');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-slate-300 text-4xl animate-pulse">hourglass_top</span>
          <p className="text-sm text-slate-400 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 md:p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-500 text-xl mt-0.5">error</span>
          <div>
            <p className="text-sm font-bold text-red-800 mb-1">Unable to Load Dashboard</p>
            <p className="text-sm text-red-600 leading-relaxed">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: 'Current Month Bill', value: `₹${Number(data.currentMonthBill || 0).toLocaleString('en-IN')}`, icon: 'receipt_long', color: 'bg-blue-50 text-blue-600' },
    { label: 'Outstanding Amount', value: `₹${Number(data.outstanding || 0).toLocaleString('en-IN')}`, icon: 'account_balance', color: data.outstanding > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600' },
    { label: 'Pending Jugs', value: data.pendingJugs ?? 0, icon: 'inventory_2', color: 'bg-purple-50 text-purple-600' },
    { label: 'Last Delivery', value: data.lastDeliveryDate || '—', icon: 'calendar_today', color: 'bg-cyan-50 text-cyan-600' },
  ];

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-lg md:text-xl font-bold text-slate-900 mb-1">{data.company || 'Dashboard'}</h1>
      <p className="text-sm text-slate-500 mb-5">Your account overview</p>

      {data.holidayNotice && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-500 mt-0.5">event_busy</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Upcoming Supplier Holiday</p>
            <p className="text-sm text-amber-700">{data.holidayNotice.reason} — {data.holidayNotice.dates}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
              <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{c.label}</p>
            <p className="text-lg md:text-xl font-bold text-slate-900 mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Recent Deliveries</h2>
        </div>
        {(!data.recentDeliveries || data.recentDeliveries.length === 0) ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-slate-300 text-4xl">inventory</span>
            <p className="text-sm text-slate-400 mt-2">No deliveries yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Jugs Delivered</th>
                  <th className="px-5 py-3 font-semibold">Empty Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentDeliveries.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-700">{d.date}</td>
                    <td className="px-5 py-3 text-slate-600">{d.jugsDelivered}</td>
                    <td className="px-5 py-3 text-slate-600">{d.emptyCollected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
