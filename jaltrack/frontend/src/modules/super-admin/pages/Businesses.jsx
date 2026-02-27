import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API as API_BASE } from '../../../core/apiBase';

const API = `${API_BASE}/super-admin`;
const token = () => localStorage.getItem('token');
const hdrs = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

export default function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`${API}/businesses?${params}`, { headers: hdrs() })
      .then((r) => r.json())
      .then((d) => setBusinesses(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, statusFilter]);

  const toggleStatus = async (id, current) => {
    const next = current === 'active' ? 'suspended' : 'active';
    await fetch(`${API}/businesses/${id}/status`, { method: 'PUT', headers: hdrs(), body: JSON.stringify({ status: next }) });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-900">Businesses</h2>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800">
          + Add Business
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="trial">Trial</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="px-4 py-3 text-left font-semibold">Business</th>
                <th className="px-4 py-3 text-left font-semibold">Owner</th>
                <th className="px-4 py-3 text-left font-semibold">City</th>
                <th className="px-4 py-3 text-left font-semibold">Plan</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Expiry</th>
                <th className="px-4 py-3 text-center font-semibold">Customers</th>
                <th className="px-4 py-3 text-center font-semibold">D-Boys</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>}
              {!loading && businesses.length === 0 && <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-400">No businesses found</td></tr>}
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{b.name}</td>
                  <td className="px-4 py-3 text-slate-600">{b.owner_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{b.city || '—'}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{b.plan_name || '—'}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{b.subscription_expiry ? new Date(b.subscription_expiry).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-center font-semibold">{b.customer_count ?? 0}</td>
                  <td className="px-4 py-3 text-center font-semibold">{b.delivery_boy_count ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => navigate(`/super-admin/businesses/${b.id}`)} className="p-1.5 rounded-lg hover:bg-slate-100" title="View">
                        <span className="material-symbols-outlined text-lg text-slate-500">visibility</span>
                      </button>
                      <button onClick={() => toggleStatus(b.id, b.status)} className="p-1.5 rounded-lg hover:bg-slate-100" title={b.status === 'active' ? 'Suspend' : 'Activate'}>
                        <span className={`material-symbols-outlined text-lg ${b.status === 'active' ? 'text-red-500' : 'text-green-500'}`}>
                          {b.status === 'active' ? 'block' : 'check_circle'}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function StatusBadge({ status }) {
  const c = { active: 'bg-green-50 text-green-700', suspended: 'bg-red-50 text-red-700', trial: 'bg-amber-50 text-amber-700' };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', ownerName: '', email: '', phone: '', city: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API}/businesses`, { method: 'POST', headers: hdrs(), body: JSON.stringify(form) });
      onCreated();
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Add Business</h3>
        <Input label="Business Name" value={form.name} onChange={set('name')} required />
        <Input label="Owner Name" value={form.ownerName} onChange={set('ownerName')} />
        <Input label="Email" value={form.email} onChange={set('email')} type="email" />
        <Input label="Phone" value={form.phone} onChange={set('phone')} />
        <Input label="City" value={form.city} onChange={set('city')} />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600">Cancel</button>
          <button type="submit" disabled={saving || !form.name} className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            {saving ? 'Creating...' : 'Create'}
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
