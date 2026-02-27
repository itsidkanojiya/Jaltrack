import { useState, useEffect } from 'react';

const API = '/api';
const EMPTY = { date: '', type: 'Fuel', amount: '', notes: '' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/expenses`).then((r) => r.json()).then((d) => setExpenses(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      .then((r) => r.ok && r.json())
      .then((created) => { if (created) { setExpenses((ex) => [created, ...ex]); setForm(EMPTY); } })
      .catch(console.error);
  };

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading...</p></div>;

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-lg font-bold">Expenses</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold mb-4">Add Expense</h2>
        <div className="grid grid-cols-4 gap-4 max-w-3xl">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input type="date" value={form.date} onChange={set('date')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <select value={form.type} onChange={set('type')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option>Fuel</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Amount (₹)</label>
            <input type="number" value={form.amount} onChange={set('amount')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <input value={form.notes} onChange={set('notes')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        </div>
        <button type="submit" className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">Save Expense</button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60">
              <Th>Date</Th><Th>Type</Th><Th align="right">Amount</Th><Th>Notes</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5 text-sm font-medium">{r.date}</td>
                <td className="px-6 py-3.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${r.type === 'Fuel' ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{r.type}</span>
                </td>
                <td className="px-6 py-3.5 text-sm font-semibold text-right">₹{Number(r.amount).toLocaleString('en-IN')}</td>
                <td className="px-6 py-3.5 text-sm text-slate-600">{r.notes}</td>
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
