import { useState, useEffect } from 'react';
import { API as API_BASE } from '../../../core/apiBase';

const API = `${API_BASE}/client`;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const FILTERS = [
  { key: 'month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'custom', label: 'Custom Range' },
];

export default function ClientDeliveries() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDeliveries = () => {
    setLoading(true);
    setError('');
    let url = `${API}/deliveries?range=${filter}`;
    if (filter === 'custom' && from && to) url = `${API}/deliveries?from=${from}&to=${to}`;

    fetch(url, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Access denied. Your account may not be linked to a customer yet.' : 'Failed to load deliveries');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (filter !== 'custom') fetchDeliveries();
  }, [filter]);

  const deliveries = data?.deliveries || [];
  const totals = data?.totals;

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-lg md:text-xl font-bold text-slate-900 mb-1">Deliveries</h1>
      <p className="text-sm text-slate-500 mb-5">Your delivery history</p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
              filter === key ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}

        {filter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 md:flex-none" />
            <span className="text-sm text-slate-400">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 md:flex-none" />
            <button onClick={fetchDeliveries}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Summary pills */}
      {totals && (
        <div className="flex flex-wrap gap-2 md:gap-3 mb-5">
          <div className="bg-blue-50 text-blue-700 rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm font-semibold">
            {totals.count ?? 0} deliveries
          </div>
          <div className="bg-green-50 text-green-700 rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm font-semibold">
            {totals.totalDelivered ?? 0} jugs delivered
          </div>
          <div className="bg-slate-100 text-slate-600 rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm font-semibold">
            {totals.totalEmpty ?? 0} empty collected
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <span className="material-symbols-outlined text-slate-300 text-4xl animate-pulse">hourglass_top</span>
            <p className="text-sm text-slate-400 mt-2">Loading deliveries...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-500 text-xl mt-0.5">error</span>
          <div>
            <p className="text-sm font-bold text-red-800 mb-1">Unable to Load Deliveries</p>
            <p className="text-sm text-red-600 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && deliveries.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-12">
          <span className="material-symbols-outlined text-slate-300 text-5xl">local_shipping</span>
          <p className="text-sm text-slate-400 mt-3">No deliveries found</p>
        </div>
      )}

      {!loading && !error && deliveries.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {deliveries.map((d, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-900">{d.date}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    d.paymentStatus === 'Pending' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
                  }`}>{d.paymentStatus || '—'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Jugs Delivered</p>
                    <p className="font-semibold text-slate-700">{d.jugsDelivered ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Empty Collected</p>
                    <p className="font-semibold text-slate-700">{d.emptyCollected ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Jugs Delivered</th>
                  <th className="px-5 py-3 font-semibold">Empty Collected</th>
                  <th className="px-5 py-3 font-semibold">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-700">{d.date}</td>
                    <td className="px-5 py-3 text-slate-600">{d.jugsDelivered ?? 0}</td>
                    <td className="px-5 py-3 text-slate-600">{d.emptyCollected ?? 0}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        d.paymentStatus === 'Pending' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
                      }`}>{d.paymentStatus || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
