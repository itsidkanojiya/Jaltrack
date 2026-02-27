import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API as API_BASE } from '../../../core/apiBase';

const API = `${API_BASE}/super-admin`;
const token = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [biz, setBiz] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      fetch(`${API}/businesses/${id}`, { headers: hdrs() }).then((r) => r.json()),
      fetch(`${API}/plans`, { headers: hdrs() }).then((r) => r.json()),
    ])
      .then(([b, p]) => { setBiz(b); setPlans(Array.isArray(p) ? p : []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const updateStatus = async (status) => {
    await fetch(`${API}/businesses/${id}/status`, { method: 'PUT', headers: hdrs(), body: JSON.stringify({ status }) });
    load();
  };

  const updateSubscription = async (data) => {
    await fetch(`${API}/businesses/${id}/subscription`, { method: 'PUT', headers: hdrs(), body: JSON.stringify(data) });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-sm text-slate-400">Loading...</p></div>;
  if (!biz) return <div className="p-6 text-center text-slate-400">Business not found</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/super-admin/businesses')} className="flex items-center gap-1 text-sm text-slate-500 font-medium mb-4 hover:text-slate-700">
        <span className="material-symbols-outlined text-lg">arrow_back</span> Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{biz.name}</h2>
          <p className="text-sm text-slate-500 mt-1">{biz.city || ''} · {biz.email || ''}</p>
        </div>
        <StatusBadge status={biz.status} />
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-6">
        <InfoCard label="Owner" value={biz.owner_name || '—'} icon="person" />
        <InfoCard label="Phone" value={biz.phone || '—'} icon="call" />
        <InfoCard label="Plan" value={biz.plan_name || '—'} icon="workspace_premium" />
        <InfoCard label="Customers" value={biz.customer_count ?? 0} icon="group" />
        <InfoCard label="Delivery Boys" value={biz.delivery_boy_count ?? 0} icon="local_shipping" />
        <InfoCard label="Total Users" value={biz.total_users ?? 0} icon="badge" />
      </div>

      {/* Subscription Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Subscription</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <p className="text-xs text-slate-500 mb-1">Start Date</p>
            <p className="text-sm font-semibold">{biz.subscription_start ? new Date(biz.subscription_start).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Expiry Date</p>
            <p className="text-sm font-semibold">{biz.subscription_expiry ? new Date(biz.subscription_expiry).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Payment Status</p>
            <p className="text-sm font-semibold capitalize">{biz.payment_status || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Plan</p>
            <select
              value={biz.plan_id || ''}
              onChange={(e) => updateSubscription({ planId: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
            >
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => updateSubscription({ expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500">
            Extend 30 Days
          </button>
          <button onClick={() => updateSubscription({ paymentStatus: 'paid' })}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-500">
            Mark Paid
          </button>
        </div>
      </div>

      {/* Status Control */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-3">Business Control</h3>
        <p className="text-sm text-slate-500 mb-4">
          Suspending a business blocks all user logins and API access. Data is preserved.
        </p>
        <div className="flex gap-3">
          {biz.status !== 'active' && (
            <button onClick={() => updateStatus('active')} className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-500">
              <span className="material-symbols-outlined text-base mr-1 align-text-bottom">check_circle</span> Activate
            </button>
          )}
          {biz.status !== 'suspended' && (
            <button onClick={() => updateStatus('suspended')} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-500">
              <span className="material-symbols-outlined text-base mr-1 align-text-bottom">block</span> Suspend
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-slate-500 text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const c = { active: 'bg-green-100 text-green-700', suspended: 'bg-red-100 text-red-700', trial: 'bg-amber-100 text-amber-700' };
  return <span className={`text-xs font-bold px-3 py-1 rounded-full ${c[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}
