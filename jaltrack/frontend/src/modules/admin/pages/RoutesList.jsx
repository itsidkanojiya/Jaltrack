import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../../../core/apiBase';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
}

const statusColors = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function RoutesList() {
  const [list, setList] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    date: new Date().toISOString().slice(0, 10),
    deliveryBoyId: '',
    status: '',
  });

  const load = () => {
    setError('');
    const params = new URLSearchParams();
    if (filters.date) params.set('date', filters.date);
    if (filters.deliveryBoyId) params.set('deliveryBoyId', filters.deliveryBoyId);
    if (filters.status) params.set('status', filters.status);
    fetch(`${API}/routes?${params}`, { headers: authHeaders() })
      .then((r) => {
        if (r.status === 401) throw new Error('Please log in again.');
        return r.json();
      })
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load routes');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch(`${API}/salary/delivery-boys`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((a) => setDeliveryBoys(Array.isArray(a) ? a : []))
      .catch(() => setDeliveryBoys([]));
  }, []);

  useEffect(load, [filters.date, filters.deliveryBoyId, filters.status]);

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading routes...</p></div>;

  return (
    <div className="p-6 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-red-500">error</span>{error}</span>
          {error.includes('log in') && <a href="/business/login" className="text-sm font-semibold text-primary hover:underline">Go to Login</a>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">Route Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Planned delivery routes</p>
        </div>
        <Link
          to="/business/routes/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create route
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={setFilter('date')}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Delivery boy</label>
          <select
            value={filters.deliveryBoyId}
            onChange={setFilter('deliveryBoyId')}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
          >
            <option value="">All</option>
            {deliveryBoys.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={setFilter('status')}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[120px]"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No routes found. Create a route to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Delivery boy</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Stops</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.routeDate}</td>
                  <td className="px-4 py-3 text-slate-600">{r.deliveryBoyName || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.stopCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[r.status] || 'bg-slate-100 text-slate-700'}`}>
                      {r.status?.replace('_', ' ') || 'draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/business/routes/${r.id}`} className="text-primary font-medium hover:underline">
                      View
                    </Link>
                    {r.status === 'draft' && (
                      <>
                        <span className="text-slate-300 mx-1">|</span>
                        <Link to={`/business/routes/${r.id}/edit`} className="text-primary font-medium hover:underline">
                          Edit
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
