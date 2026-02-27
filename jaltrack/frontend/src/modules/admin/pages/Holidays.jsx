import { useState, useEffect } from 'react';

const API = '/api';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
}

const EMPTY = { start: '', end: '', reason: '' };

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    fetch(`${API}/holidays`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setHolidays(Array.isArray(d) ? d : []))
      .catch((err) => { console.error(err); setError('Failed to load holidays'); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.start || !form.reason) return;
    setError('');
    setSaving(true);
    const payload = {
      start: form.start,
      end: form.end || form.start,
      reason: form.reason.trim(),
    };
    fetch(`${API}/holidays`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error || 'Failed to add holiday'); });
        return r.json();
      })
      .then((created) => {
        if (created) {
          setHolidays((h) => [created, ...h]);
          setForm(EMPTY);
        }
      })
      .catch((err) => setError(err.message || 'Failed to add holiday'))
      .finally(() => setSaving(false));
  };

  const handleDelete = (id) => {
    fetch(`${API}/holidays/${id}`, { method: 'DELETE', headers: authHeaders() })
      .then((r) => { if (r.ok) setHolidays((h) => h.filter((x) => x.id !== id)); })
      .catch(console.error);
  };

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading...</p></div>;

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-lg font-bold">Supplier Holidays</h1>
      <p className="text-sm text-slate-500 -mt-3">Days when delivery is suspended — not billed to customers</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">error</span>{error}
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold mb-4">Add Holiday</h2>
        <div className="flex flex-wrap items-end gap-4 max-w-2xl">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <input type="date" value={form.start} onChange={set('start')} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
            <input type="date" value={form.end} onChange={set('end')} min={form.start || undefined} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex-[2] min-w-[160px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
            <input value={form.reason} onChange={set('reason')} placeholder="e.g. Holi, Diwali" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold whitespace-nowrap disabled:opacity-50">
            {saving ? 'Adding...' : 'Add Holiday'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60">
              <Th>Start Date</Th><Th>End Date</Th><Th>Reason</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holidays.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">No holidays added yet. Use the form above to add one.</td></tr>
            )}
            {holidays.map((h) => (
              <tr key={h.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5 text-sm font-medium">{h.start}</td>
                <td className="px-6 py-3.5 text-sm">{h.end || h.start}</td>
                <td className="px-6 py-3.5 text-sm">{h.reason}</td>
                <td className="px-6 py-3.5">
                  <button onClick={() => handleDelete(h.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">{children}</th>;
}
