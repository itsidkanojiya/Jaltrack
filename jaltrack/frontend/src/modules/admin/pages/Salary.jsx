import { useState, useEffect } from 'react';
import { API } from '../../../core/apiBase';
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
}

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const EMPTY_FORM = { userId: '', type: 'Daily', rate: '', daysWorked: '', month: currentMonth, year: currentYear };

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);

  const load = () => {
    setError('');
    Promise.all([
      fetch(`${API}/salary?month=${month}&year=${year}`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/salary/delivery-boys`, { headers: authHeaders() }).then((r) => r.json()).catch(() => []),
    ])
      .then(([data, boys]) => {
        const list = data.salaries ?? (Array.isArray(data) ? data : []);
        setSalaries(list);
        setSummary(data.summary ?? null);
        setDeliveryBoys(Array.isArray(boys) ? boys : []);
      })
      .catch((err) => { console.error(err); setError('Failed to load data'); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [month, year]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value === '' ? '' : Number(e.target.value) }));

  const grandTotal = salaries.reduce((s, r) => s + Number(r.total), 0);

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      userId: String(row.userId),
      type: row.type,
      rate: row.rate,
      daysWorked: row.daysWorked ?? '',
      month: month,
      year: year,
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Delete salary record for ${row.name} (₹${Number(row.total).toLocaleString('en-IN')})?`)) return;
    fetch(`${API}/salary/${row.id}`, { method: 'DELETE', headers: authHeaders() })
      .then((r) => { if (r.ok) load(); else return r.json().then((d) => { throw new Error(d.error || 'Delete failed'); }); })
      .catch((err) => setError(err.message || 'Failed to delete'));
  };

  const handleRecordPayment = (row) => {
    setPaymentModal({ ...row, newAmount: row.amountPaid });
  };

  const submitPayment = () => {
    if (paymentModal == null) return;
    const amount = Number(paymentModal.newAmount);
    if (isNaN(amount) || amount < 0) return;
    setSaving(true);
    fetch(`${API}/salary/${paymentModal.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ amountPaid: amount }),
    })
      .then((r) => (r.ok ? r.json() : r.json().then((d) => { throw new Error(d.error || 'Failed'); })))
      .then(() => { setPaymentModal(null); load(); })
      .catch((err) => setError(err.message || 'Failed to update payment'))
      .finally(() => setSaving(false));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.userId) return;
    setError('');
    setSaving(true);
    const payload = {
      userId: Number(form.userId),
      type: form.type,
      rate: Number(form.rate) || 0,
      daysWorked: form.type === 'Daily' ? (Number(form.daysWorked) || 0) : undefined,
      month: Number(form.month),
      year: Number(form.year),
    };
    const url = editingId ? `${API}/salary/${editingId}` : `${API}/salary`;
    const method = editingId ? 'PUT' : 'POST';
    fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error || (editingId ? 'Failed to update' : 'Failed to add salary')); });
        return r.json();
      })
      .then((created) => {
        if (created) {
          setSalaries((prev) => (editingId ? prev.map((s) => (s.id === editingId ? { ...s, ...created } : s)) : [created, ...prev]));
          setForm({ ...EMPTY_FORM, month: currentMonth, year: currentYear });
          setShowForm(false);
          setEditingId(null);
          load();
        }
      })
      .catch((err) => setError(err.message || 'Failed to save'))
      .finally(() => setSaving(false));
  };

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading...</p></div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Delivery Boy Salary</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monthly salary summary · Paid vs Pending (udhar)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            {[currentYear, currentYear - 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => { setEditingId(null); setShowForm(!showForm); setError(''); setForm({ ...EMPTY_FORM, month, year }); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">add</span> Add Delivery Boy
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">error</span>{error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Total Salary (Month)</p>
            <p className="text-xl font-bold text-slate-900">₹{Number(summary.totalSalary || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <p className="text-xs font-medium text-green-700 uppercase">Paid (Udhar)</p>
            <p className="text-xl font-bold text-green-800">₹{Number(summary.totalPaid || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <p className="text-xs font-medium text-amber-700 uppercase">Pending</p>
            <p className="text-xl font-bold text-amber-800">₹{Number(summary.totalPending || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold mb-4">{editingId ? 'Edit Salary Record' : 'Add Salary Record'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Boy *</label>
              <select value={form.userId} onChange={set('userId')} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">Select delivery boy</option>
                {deliveryBoys.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Salary Type</label>
              <select value={form.type} onChange={set('type')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="Daily">Daily</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{form.type === 'Daily' ? 'Rate per Day (₹)' : 'Fixed Salary (₹)'}</label>
              <input type="number" value={form.rate} onChange={setNum('rate')} min="0" step="1" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            {form.type === 'Daily' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Days Worked</label>
                <input type="number" value={form.daysWorked} onChange={setNum('daysWorked')} min="0" max="31" required={form.type === 'Daily'} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Period (Month)</label>
              <select value={form.month} onChange={set('month')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Year</label>
              <select value={form.year} onChange={set('year')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                {[currentYear, currentYear - 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setError(''); }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60">
              <Th>Delivery Boy</Th><Th>Salary Type</Th><Th align="right">Rate</Th><Th align="right">Days</Th><Th align="right">Total</Th><Th align="right">Paid</Th><Th align="right">Pending</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {salaries.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400">No salary records for {MONTHS[month]} {year}. Click &quot;Add Delivery Boy&quot; to add.</td></tr>
            )}
            {salaries.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5 text-sm font-semibold">{r.name}</td>
                <td className="px-6 py-3.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${r.type === 'Monthly' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{r.type}</span>
                </td>
                <td className="px-6 py-3.5 text-sm text-right">₹{Number(r.rate).toLocaleString('en-IN')}{r.type === 'Daily' ? '/day' : '/mo'}</td>
                <td className="px-6 py-3.5 text-sm text-right">{r.daysWorked ?? '—'}</td>
                <td className="px-6 py-3.5 text-sm font-bold text-right">₹{Number(r.total).toLocaleString('en-IN')}</td>
                <td className="px-6 py-3.5 text-sm text-right text-green-700">₹{Number(r.amountPaid ?? 0).toLocaleString('en-IN')}</td>
                <td className="px-6 py-3.5 text-sm text-right text-amber-700">₹{Number(r.pending ?? 0).toLocaleString('en-IN')}</td>
                <td className="px-6 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    <button type="button" onClick={() => handleEdit(r)} className="px-2 py-1 text-xs font-medium text-primary border border-primary rounded hover:bg-primary/5">Edit</button>
                    <button type="button" onClick={() => handleRecordPayment(r)} className="px-2 py-1 text-xs font-medium text-green-700 border border-green-600 rounded hover:bg-green-50">Pay / Udhar</button>
                    <button type="button" onClick={() => handleDelete(r)} className="px-2 py-1 text-xs font-medium text-red-600 border border-red-300 rounded hover:bg-red-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {salaries.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td colSpan={4} className="px-6 py-3 text-sm font-bold text-right">Total</td>
                <td className="px-6 py-3 text-sm font-bold text-right">₹{grandTotal.toLocaleString('en-IN')}</td>
                <td className="px-6 py-3 text-sm font-bold text-right text-green-700">₹{Number(summary?.totalPaid ?? salaries.reduce((s, r) => s + (r.amountPaid ?? 0), 0)).toLocaleString('en-IN')}</td>
                <td className="px-6 py-3 text-sm font-bold text-right text-amber-700">₹{Number(summary?.totalPending ?? salaries.reduce((s, r) => s + (r.pending ?? 0), 0)).toLocaleString('en-IN')}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setPaymentModal(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 mb-1">Record payment (Udhar)</h3>
            <p className="text-sm text-slate-500 mb-4">{paymentModal.name} · Total salary ₹{Number(paymentModal.total).toLocaleString('en-IN')}</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">Amount paid so far (₹)</label>
              <input
                type="number"
                min="0"
                max={paymentModal.total}
                step="1"
                value={paymentModal.newAmount}
                onChange={(e) => setPaymentModal((m) => ({ ...m, newAmount: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-slate-400 mt-1">Pending: ₹{Math.max(0, Number(paymentModal.total) - Number(paymentModal.newAmount || 0)).toLocaleString('en-IN')}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={submitPayment} disabled={saving} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setPaymentModal(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, align }) {
  return <th className={`px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 ${align === 'right' ? 'text-right' : ''}`}>{children}</th>;
}
