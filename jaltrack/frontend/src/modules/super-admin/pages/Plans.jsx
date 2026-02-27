import { useState, useEffect } from 'react';

const API = '/api/super-admin';
const token = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

const featureLabels = [
  { key: 'feature_expenses', label: 'Expenses' },
  { key: 'feature_events', label: 'Events' },
  { key: 'feature_jug_tracking', label: 'Jug Tracking' },
  { key: 'feature_spot_supply', label: 'Spot Supply' },
  { key: 'feature_client_portal', label: 'Client Portal' },
];

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${API}/plans`, { headers: hdrs() })
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-sm text-slate-400">Loading...</p></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-5">Subscription Plans</h2>

      <div className="grid md:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{p.name}</h3>
            <p className="text-3xl font-extrabold text-slate-900 mb-4">
              ₹{Number(p.price_monthly).toLocaleString('en-IN')}
              <span className="text-sm font-normal text-slate-400">/mo</span>
            </p>

            <div className="space-y-2 mb-4">
              <LimitRow label="Max Customers" value={p.max_customers >= 99999 ? 'Unlimited' : p.max_customers} />
              <LimitRow label="Max Delivery Boys" value={p.max_delivery_boys >= 99999 ? 'Unlimited' : p.max_delivery_boys} />
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              {featureLabels.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{label}</span>
                  <span className={`material-symbols-outlined text-base ${p[key] ? 'text-green-500' : 'text-slate-300'}`}>
                    {p[key] ? 'check_circle' : 'cancel'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LimitRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}
