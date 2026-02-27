import { useState, useEffect } from 'react';

const API = '/api';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
}

const today = new Date().toISOString().slice(0, 10);
const EMPTY = { date: today, customerId: '', jugsOut: '', emptyIn: '', payment: 'Pending', agentId: '' };

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([
      fetch(`${API}/deliveries`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/customers`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/salary/delivery-boys`, { headers: authHeaders() }).then((r) => r.json()).catch(() => []),
    ])
      .then(([d, c, a]) => {
        setDeliveries(Array.isArray(d) ? d : []);
        setCustomers(Array.isArray(c) ? c : []);
        setAgents(Array.isArray(a) ? a : []);
      })
      .catch((err) => { console.error(err); setError('Failed to load data'); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      date: form.date,
      customerId: form.customerId ? Number(form.customerId) : null,
      jugsOut: Number(form.jugsOut) || 0,
      emptyIn: Number(form.emptyIn) || 0,
      payment: form.payment || 'Pending',
      agentId: form.agentId ? Number(form.agentId) : null,
    };
    fetch(`${API}/deliveries`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error || 'Failed to add delivery'); });
        return r.json();
      })
      .then((created) => {
        if (created) {
          setDeliveries((d) => [{ ...created, customer: customers.find((c) => c.id === Number(form.customerId))?.name || created.customer, agent: agents.find((a) => a.id === Number(form.agentId))?.name || created.agent }, ...d]);
          setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10) });
          setShowForm(false);
        }
      })
      .catch((err) => setError(err.message || 'Failed to add delivery'))
      .finally(() => setSaving(false));
  };

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading deliveries...</p></div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Deliveries</h1>
          <p className="text-sm text-slate-500 mt-0.5">Daily delivery log</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
          <span className="material-symbols-outlined text-[18px]">add</span> Add Delivery
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">error</span>{error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold mb-4">New Delivery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input type="date" value={form.date} onChange={set('date')} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer *</label>
              <select value={form.customerId} onChange={set('customerId')} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.shopName ? ` (${c.shopName})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Boy</label>
              <select value={form.agentId} onChange={set('agentId')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">Select delivery boy</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <Field label="Jugs Delivered" value={form.jugsOut} onChange={set('jugsOut')} type="number" min="0" />
            <Field label="Empty Collected" value={form.emptyIn} onChange={set('emptyIn')} type="number" min="0" />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Payment Status</label>
              <select value={form.payment} onChange={set('payment')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Delivery'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60">
              <Th>Date</Th><Th>Customer</Th><Th align="right">Jugs Delivered</Th><Th align="right">Empty Collected</Th><Th>Payment</Th><Th>Delivery Boy</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deliveries.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5 text-sm font-medium">{d.date}</td>
                <td className="px-6 py-3.5 text-sm">{d.customer}</td>
                <td className="px-6 py-3.5 text-sm text-right">{d.jugsOut}</td>
                <td className="px-6 py-3.5 text-sm text-right">{d.emptyIn}</td>
                <td className="px-6 py-3.5 text-sm">{d.payment}</td>
                <td className="px-6 py-3.5 text-sm text-slate-600">{d.agent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align }) {
  return <th className={`px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 ${align === 'right' ? 'text-right' : ''}`}>{children}</th>;
}

function Field({ label, value, onChange, type = 'text', min }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange} min={min} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
    </div>
  );
}
