import { useState, useEffect } from 'react';

const API = '/api';

const EMPTY_FORM = { name: '', startDate: '', endDate: '', rate: '', deposit: '', advancePay: '', notes: '' };

export default function Events() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = () => {
    fetch(`${API}/events`, { headers }).then((r) => r.json()).then((d) => setEvents(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/events`, { method: 'POST', headers, body: JSON.stringify(form) });
      if (res.ok) {
        const created = await res.json();
        setEvents((prev) => [created, ...prev]);
        setForm(EMPTY_FORM);
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const showDetail = (id) => {
    if (selected === id) { setSelected(null); setDetail(null); return; }
    setSelected(id);
    fetch(`${API}/events/${id}`, { headers }).then((r) => r.json()).then(setDetail).catch(console.error);
  };

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading...</p></div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Events</h1>
          <p className="text-sm text-slate-500 mt-0.5">{events.length} total events</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Event'}
        </button>
      </div>

      {/* New Event Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">event</span>
            Create New Event
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Event Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Sharma Wedding, Diwali Function"
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={set('startDate')}
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Date *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={set('endDate')}
                min={form.startDate || undefined}
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rate per Jug (₹)</label>
              <input
                type="number"
                value={form.rate}
                onChange={set('rate')}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Deposit Amount (₹)</label>
              <input
                type="number"
                value={form.deposit}
                onChange={set('deposit')}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Advance Pay (₹) <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="number"
                value={form.advancePay}
                onChange={set('advancePay')}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-300"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                placeholder="Any additional details about this event..."
                rows={2}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder:text-slate-300"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Saving...</>
              ) : (
                <><span className="material-symbols-outlined text-[16px]">check</span> Save Event</>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        {events.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-slate-300 text-5xl">event</span>
            <p className="text-sm text-slate-400 mt-3">No events yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "New Event" to create your first event</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <Th>Event Name</Th><Th>Date Range</Th><Th>Rate / Jug</Th><Th align="right">Deposit</Th><Th align="right">Advance Pay</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3.5 text-sm font-semibold">{ev.name}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{ev.dates}</td>
                  <td className="px-6 py-3.5 text-sm">₹{ev.rate}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-right">₹{Number(ev.deposit).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3.5 text-sm text-right">{ev.advancePay != null ? `₹${Number(ev.advancePay).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${ev.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{ev.status}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <button onClick={() => showDetail(ev.id)} className="text-sm text-primary font-medium hover:underline">
                      {selected === ev.id ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Event Detail */}
      {selected && detail && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold mb-4">{detail.name} — Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Total Supplied" value={detail.supplied} />
            <StatCard label="Total Returned" value={detail.returned} />
            <StatCard label="Missing Jugs" value={detail.missing} highlight={detail.missing > 0} />
            <StatCard label="Penalty" value={`₹${detail.penalty}`} highlight={detail.penalty > 0} />
            <StatCard label="Refund Amount" value={`₹${Number(detail.refund).toLocaleString('en-IN')}`} />
            {detail.advancePay != null && <StatCard label="Advance Pay" value={`₹${Number(detail.advancePay).toLocaleString('en-IN')}`} />}
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, align }) {
  return <th className={`px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 ${align === 'right' ? 'text-right' : ''}`}>{children}</th>;
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}
