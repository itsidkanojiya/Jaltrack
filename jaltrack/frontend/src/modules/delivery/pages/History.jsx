import { useState, useEffect } from 'react';

const API = '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

function isToday(dateStr) {
  if (!dateStr) return false;
  const now = new Date();
  return dateStr.includes(String(now.getDate())) && dateStr.includes(now.toLocaleString('en', { month: 'short' }));
}

function isThisWeek(dateStr) {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  } catch {
    return true;
  }
}

export default function History() {
  const [deliveries, setDeliveries] = useState([]);
  const [spots, setSpots] = useState([]);
  const [filter, setFilter] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/deliveries?limit=100`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/spot-supply`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([d, s]) => {
        setDeliveries(Array.isArray(d) ? d : []);
        setSpots(Array.isArray(s) ? s : []);
      })
      .catch((err) => {
        console.error(err);
        if (err?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/delivery/login';
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const all = [
    ...deliveries.map((d) => ({ ...d, type: 'Delivery', key: `d-${d.id}` })),
    ...spots.map((s) => ({ id: s.id, date: s.date, customer: s.location, jugsOut: s.jugs, payment: s.mode, type: 'Spot', key: `s-${s.id}` })),
  ];

  const filtered = filter === 'today'
    ? all.filter((r) => isToday(r.date))
    : filter === 'week'
    ? all.filter((r) => isThisWeek(r.date))
    : all;

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-5xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-5 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-0">History</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 md:flex-none md:px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                filter === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar (desktop) */}
      <div className="hidden md:grid grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Records" value={filtered.length} icon="receipt_long" color="text-blue-600 bg-blue-50" />
        <SummaryCard label="Deliveries" value={filtered.filter((r) => r.type === 'Delivery').length} icon="local_shipping" color="text-green-600 bg-green-50" />
        <SummaryCard label="Spot Supply" value={filtered.filter((r) => r.type === 'Spot').length} icon="bolt" color="text-purple-600 bg-purple-50" />
        <SummaryCard label="Total Jugs" value={filtered.reduce((s, r) => s + (Number(r.jugsOut) || 0), 0)} icon="inventory_2" color="text-orange-600 bg-orange-50" />
      </div>

      {loading && <p className="text-center text-sm text-slate-400 py-8">Loading...</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 md:py-20">
          <span className="material-symbols-outlined text-slate-300 text-5xl md:text-6xl">folder_off</span>
          <p className="text-slate-400 mt-2 text-sm md:text-base">No records found</p>
        </div>
      )}

      {/* Records — 1 col mobile, 2 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-4">
        {filtered.map((r) => (
          <div key={r.key} className="bg-white rounded-xl md:rounded-2xl border border-slate-200 p-4 md:p-5 hover:shadow-md hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-slate-900 truncate">{r.customer || '—'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.date}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-lg font-bold text-primary">{r.jugsOut || 0}</p>
                <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase">jugs</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2.5">
              <span className={`text-[11px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ${
                r.type === 'Spot' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
              }`}>{r.type}</span>
              <span className={`text-[11px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ${
                r.payment === 'Pending' ? 'bg-orange-50 text-orange-700' :
                r.payment === 'Cash' ? 'bg-green-50 text-green-700' :
                'bg-blue-50 text-blue-700'
              }`}>{r.payment || 'Pending'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
        </div>
      </div>
    </div>
  );
}
