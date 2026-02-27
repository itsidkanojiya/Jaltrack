import { useState, useEffect } from 'react';

const API = '/api/super-admin';
const token = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/announcements`, { headers: hdrs() }).then((r) => r.json()),
      fetch(`${API}/businesses`, { headers: hdrs() }).then((r) => r.json()),
    ])
      .then(([a, b]) => { setAnnouncements(Array.isArray(a) ? a : []); setBusinesses(Array.isArray(b) ? b : []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const deleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await fetch(`${API}/announcements/${id}`, { method: 'DELETE', headers: hdrs() });
    load();
  };

  const toggleActive = async (id, current) => {
    await fetch(`${API}/announcements/${id}`, { method: 'PUT', headers: hdrs(), body: JSON.stringify({ isActive: !current }) });
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-900">Announcements</h2>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800">
          + New Announcement
        </button>
      </div>

      {loading && <p className="text-center text-sm text-slate-400 py-8">Loading...</p>}

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className={`bg-white rounded-xl border p-5 ${a.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    a.target === 'all' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {a.target === 'all' ? 'All Businesses' : a.business_name || 'Specific'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{a.message}</p>
                <p className="text-xs text-slate-400 mt-2">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</p>
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <button onClick={() => toggleActive(a.id, a.is_active)} className="p-1.5 rounded-lg hover:bg-slate-100" title={a.is_active ? 'Deactivate' : 'Activate'}>
                  <span className={`material-symbols-outlined text-lg ${a.is_active ? 'text-green-500' : 'text-slate-400'}`}>
                    {a.is_active ? 'toggle_on' : 'toggle_off'}
                  </span>
                </button>
                <button onClick={() => deleteAnnouncement(a.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                  <span className="material-symbols-outlined text-lg text-red-400">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && announcements.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-slate-300 text-5xl">campaign</span>
            <p className="text-slate-400 mt-2 text-sm">No announcements yet</p>
          </div>
        )}
      </div>

      {showCreate && <CreateModal businesses={businesses} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function CreateModal({ businesses, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', message: '', target: 'all', businessId: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API}/announcements`, {
        method: 'POST', headers: hdrs(),
        body: JSON.stringify({ ...form, businessId: form.target === 'specific' ? form.businessId : null }),
      });
      onCreated();
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-slate-900">New Announcement</h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input value={form.title} onChange={set('title')} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
          <textarea value={form.message} onChange={set('message')} rows="3" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target</label>
          <select value={form.target} onChange={set('target')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="all">All Businesses</option>
            <option value="specific">Specific Business</option>
          </select>
        </div>
        {form.target === 'specific' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Business</label>
            <select value={form.businessId} onChange={set('businessId')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="">Select...</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600">Cancel</button>
          <button type="submit" disabled={saving || !form.title || !form.message} className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            {saving ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
}
