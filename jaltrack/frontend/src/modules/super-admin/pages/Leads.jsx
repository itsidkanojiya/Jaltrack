import { useState, useEffect } from 'react';

const API = '/api/super-admin';
const token = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

const STATUS_OPTIONS = ['new', 'demo_done', 'converted', 'lost'];
const STATUS_COLORS = { new: 'bg-blue-50 text-blue-700', demo_done: 'bg-amber-50 text-amber-700', converted: 'bg-green-50 text-green-700', lost: 'bg-red-50 text-red-700' };

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${API}/leads`, { headers: hdrs() })
      .then((r) => r.json())
      .then((d) => setLeads(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = async (id, status) => {
    await fetch(`${API}/leads/${id}`, { method: 'PUT', headers: hdrs(), body: JSON.stringify({ status }) });
    load();
  };

  const deleteLead = async (id) => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`${API}/leads/${id}`, { method: 'DELETE', headers: hdrs() });
    load();
  };

  const convertLead = async (id) => {
    const email = prompt('Admin email for the new business:');
    const password = prompt('Admin password:');
    if (!email || !password) return;
    await fetch(`${API}/leads/${id}/convert`, { method: 'POST', headers: hdrs(), body: JSON.stringify({ planId: 1, adminEmail: email, adminPassword: password }) });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-900">Sales Leads</h2>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800">
          + Add Lead
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="px-4 py-3 text-left font-semibold">Business</th>
                <th className="px-4 py-3 text-left font-semibold">Contact</th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-left font-semibold">City</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Follow-up</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>}
              {!loading && leads.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400">No leads yet</td></tr>}
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{l.business_name}</td>
                  <td className="px-4 py-3 text-slate-600">{l.contact_person || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{l.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{l.city || '—'}</td>
                  <td className="px-4 py-3">
                    <select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border-0 ${STATUS_COLORS[l.status] || 'bg-slate-100'}`}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{l.follow_up_date ? new Date(l.follow_up_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {l.status !== 'converted' && (
                        <button onClick={() => convertLead(l.id)} className="p-1.5 rounded-lg hover:bg-green-50" title="Convert to Business">
                          <span className="material-symbols-outlined text-lg text-green-600">arrow_circle_right</span>
                        </button>
                      )}
                      <button onClick={() => deleteLead(l.id)} className="p-1.5 rounded-lg hover:bg-red-50" title="Delete">
                        <span className="material-symbols-outlined text-lg text-red-400">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateLeadModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function CreateLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ businessName: '', contactPerson: '', phone: '', email: '', city: '', notes: '', followUpDate: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API}/leads`, { method: 'POST', headers: hdrs(), body: JSON.stringify(form) });
      onCreated();
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-slate-900">New Lead</h3>
        <Input label="Business Name" value={form.businessName} onChange={set('businessName')} required />
        <Input label="Contact Person" value={form.contactPerson} onChange={set('contactPerson')} />
        <Input label="Phone" value={form.phone} onChange={set('phone')} />
        <Input label="Email" value={form.email} onChange={set('email')} type="email" />
        <Input label="City" value={form.city} onChange={set('city')} />
        <Input label="Follow-up Date" value={form.followUpDate} onChange={set('followUpDate')} type="date" />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={set('notes')} rows="2" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600">Cancel</button>
          <button type="submit" disabled={saving || !form.businessName} className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input {...props} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
    </div>
  );
}
