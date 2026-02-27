import { useState, useEffect } from 'react';
import { API } from '../../../core/apiBase';

function authHeaders(includeJson = false) {
  const token = localStorage.getItem('token');
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  return includeJson ? { ...base, 'Content-Type': 'application/json' } : base;
}

const EMPTY = { location: '', jugs: '', mode: 'Cash', amount: '', notes: '' };

export default function SpotSupply() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/spot-supply`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API}/spot-supply`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(form),
    })
      .then((r) => r.ok && r.json())
      .then((created) => { if (created) { setList((l) => [created, ...l]); setForm(EMPTY); } })
      .catch(console.error);
  };

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading...</p></div>;

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-lg font-bold">Spot Supply</h1>
      <p className="text-sm text-slate-500 -mt-3">Non-contract one-time orders</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold mb-4">New Spot Supply Entry</h2>
        <div className="grid grid-cols-3 gap-4 max-w-3xl">
          <Field label="Location / Factory Name" value={form.location} onChange={set('location')} />
          <Field label="Jugs Given" value={form.jugs} onChange={set('jugs')} type="number" />
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Payment Mode</label>
            <select value={form.mode} onChange={set('mode')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option>Cash</option><option>UPI</option><option>Pending</option>
            </select>
          </div>
          <Field label="Amount (₹)" value={form.amount} onChange={set('amount')} type="number" />
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <input value={form.notes} onChange={set('notes')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        </div>
        <button type="submit" className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">Record Spot Supply</button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-sm">Spot Supply – Non Contract</h3></div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60">
              <Th>Date</Th><Th>Location</Th><Th align="right">Jugs</Th><Th>Payment Mode</Th><Th align="right">Amount</Th><Th>Notes</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5 text-sm font-medium">{r.date}</td>
                <td className="px-6 py-3.5 text-sm">{r.location}</td>
                <td className="px-6 py-3.5 text-sm text-right">{r.jugs}</td>
                <td className="px-6 py-3.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${r.mode === 'Cash' ? 'bg-green-50 text-green-700' : r.mode === 'UPI' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{r.mode}</span>
                </td>
                <td className="px-6 py-3.5 text-sm font-semibold text-right">₹{r.amount}</td>
                <td className="px-6 py-3.5 text-sm text-slate-500">{r.notes || '—'}</td>
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

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
    </div>
  );
}
