import { useState, useEffect } from 'react';

const API = '/api/super-admin';
const token = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${token()}` });

export default function Analytics() {
  const [topBiz, setTopBiz] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [churn, setChurn] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/analytics/top-businesses`, { headers: hdrs() }).then((r) => r.json()),
      fetch(`${API}/analytics/growth`, { headers: hdrs() }).then((r) => r.json()),
      fetch(`${API}/analytics/churn`, { headers: hdrs() }).then((r) => r.json()),
      fetch(`${API}/analytics/revenue`, { headers: hdrs() }).then((r) => r.json()),
    ])
      .then(([t, g, c, r]) => {
        setTopBiz(Array.isArray(t) ? t : []);
        setGrowth(Array.isArray(g) ? g : []);
        setChurn(Array.isArray(c) ? c : []);
        setRevenue(Array.isArray(r) ? r : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-sm text-slate-400">Loading...</p></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-5">Analytics</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <Section title="Revenue by Plan" icon="payments">
          {revenue.length === 0 ? <Empty /> : (
            <div className="space-y-3">
              {revenue.map((r) => (
                <div key={r.plan} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.plan}</p>
                    <p className="text-xs text-slate-500">{r.businesses} businesses · ₹{Number(r.price_monthly).toLocaleString('en-IN')}/mo each</p>
                  </div>
                  <p className="text-base font-bold text-green-600">₹{Number(r.total_revenue || 0).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Top Businesses */}
        <Section title="Top Businesses by Customers" icon="trending_up">
          {topBiz.length === 0 ? <Empty /> : (
            <div className="space-y-2">
              {topBiz.map((b, i) => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.city || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{b.customers}</p>
                    <p className="text-[10px] text-slate-400">customers</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Monthly Growth */}
        <Section title="Monthly Business Growth" icon="show_chart">
          {growth.length === 0 ? <Empty /> : (
            <div className="space-y-2">
              {growth.map((g) => (
                <div key={g.month} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">{g.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.max(20, g.count * 20)}px` }} />
                    <span className="text-sm font-bold text-slate-900">{g.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Churn Risk */}
        <Section title="Churn Risk (Expiring Soon)" icon="warning">
          {churn.length === 0 ? (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-green-400 text-4xl">check_circle</span>
              <p className="text-sm text-slate-500 mt-2">No businesses at risk</p>
            </div>
          ) : (
            <div className="space-y-2">
              {churn.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.city || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-red-600">
                      Expires {c.subscription_expiry ? new Date(c.subscription_expiry).toLocaleDateString() : '—'}
                    </p>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-slate-500 text-lg">{icon}</span>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-center text-sm text-slate-400 py-6">No data available</p>;
}

function StatusBadge({ status }) {
  const c = { active: 'bg-green-100 text-green-700', suspended: 'bg-red-100 text-red-700', trial: 'bg-amber-100 text-amber-700' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c[status] || 'bg-slate-100'}`}>{status}</span>;
}
