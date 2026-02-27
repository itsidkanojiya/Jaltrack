import { useState, useEffect } from 'react';

const API = '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
}

const EMPTY_FORM = { name: '', shopName: '', phone: '', address: '', rate: '', joined: '', holidayBilling: true };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setError('');
    fetch(`${API}/customers`, { headers: authHeaders() })
      .then((r) => {
        if (r.status === 401) throw new Error('Please log in again.');
        return r.json();
      })
      .then((d) => setCustomers(Array.isArray(d) ? d : []))
      .catch((err) => { console.error(err); setError(err.message || 'Failed to load customers'); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    fetch(`${API}/customers`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error || 'Failed to save customer'); });
        return r.json();
      })
      .then((created) => {
        if (created) { setCustomers((c) => [created, ...c]); setForm(EMPTY_FORM); setShowForm(false); }
      })
      .catch((err) => setError(err.message || 'Failed to save customer'))
      .finally(() => setSaving(false));
  };

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading customers...</p></div>;

  return (
    <div className="p-6 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-red-500">error</span>{error}</span>
          {error.includes('log in') && (
            <a href="/business/login" className="text-sm font-semibold text-primary hover:underline">Go to Login</a>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers.length} active subscribers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
          <span className="material-symbols-outlined text-[18px]">person_add</span> Add Customer
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold mb-4">New Customer</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
            <Field label="Full Name" value={form.name} onChange={set('name')} required placeholder="e.g. Ravji Bhai" />
            <Field label="Shop / Business Name" value={form.shopName} onChange={set('shopName')} placeholder="e.g. Sharma Sweets" />
            <Field label="Phone (+91)" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
            <Field label="Address" value={form.address} onChange={set('address')} placeholder="Full address" />
            <Field label="Rate per Jug (₹)" value={form.rate} onChange={set('rate')} type="number" />
            <Field label="Joining Date" value={form.joined} onChange={set('joined')} type="date" />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.holidayBilling} onChange={set('holidayBilling')} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                Client Holiday Billing
              </label>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Default suggested based on joining date.</p>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save Customer'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60">
              <Th>Name</Th><Th>Phone</Th><Th>Rate</Th><Th>Joining Date</Th><Th>Holiday Billing</Th><Th align="right">Pending Jugs</Th><Th align="right">Outstanding</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5">
                  <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                  {c.shopName && <p className="text-xs text-slate-400 mt-0.5">{c.shopName}</p>}
                </td>
                <td className="px-6 py-3.5 text-sm text-slate-600">{c.phone}</td>
                <td className="px-6 py-3.5 text-sm">₹{c.rate}</td>
                <td className="px-6 py-3.5 text-sm text-slate-600">{c.joined}</td>
                <td className="px-6 py-3.5">
                  {c.holidayBilling
                    ? <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">Yes</span>
                    : <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">No</span>}
                </td>
                <td className="px-6 py-3.5 text-sm text-right">{c.pending}</td>
                <td className={`px-6 py-3.5 text-sm font-semibold text-right ${c.outstanding > 0 ? 'text-red-600' : ''}`}>₹{Number(c.outstanding).toLocaleString('en-IN')}</td>
                <td className="px-6 py-3.5">
                  <div className="flex gap-1">
                    <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                  </div>
                </td>
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

function Field({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-300" />
    </div>
  );
}
