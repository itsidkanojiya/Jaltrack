import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API = '/api';

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

export default function RouteDetail() {
  const { id } = useParams();
  const [route, setRoute] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!id || id === 'new') return;
    setLoading(true);
    setError('');
    Promise.all([
      fetch(`${API}/routes/${id}`, { headers: authHeaders() }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API}/routes/${id}/summary`, { headers: authHeaders() }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([r, s]) => {
        setRoute(r || null);
        setSummary(s || null);
        if (!r) setError('Route not found');
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load route');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading route...</p></div>;
  if (error || !route) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error || 'Route not found'}</div>
        <Link to="/business/routes" className="inline-block mt-4 text-primary font-medium">← Back to routes</Link>
      </div>
    );
  }

  const isDraft = route.status === 'draft';

  const activateRoute = () => {
    setActivating(true);
    fetch(`${API}/routes/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'active' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((updated) => {
        if (updated) setRoute(updated);
      })
      .catch(console.error)
      .finally(() => setActivating(false));
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/business/routes" className="text-slate-500 hover:text-slate-700">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold">{route.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {route.routeDate} · {route.deliveryBoyName || '—'} · {(route.stops || []).length} stops
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${statusColors[route.status] || 'bg-slate-100 text-slate-700'}`}>
            {route.status?.replace('_', ' ') || 'draft'}
          </span>
          {isDraft && (
            <>
              <button type="button" onClick={activateRoute} disabled={activating} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                <span className="material-symbols-outlined text-[18px]">play_arrow</span> {activating ? 'Activating...' : 'Activate route'}
              </button>
              <Link to={`/business/routes/${id}/edit`} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                <span className="material-symbols-outlined text-[18px]">edit</span> Edit
              </Link>
            </>
          )}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Expected delivery</p>
            <p className="text-lg font-bold text-slate-900">{summary.totalExpectedDelivery ?? 0}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Expected empty</p>
            <p className="text-lg font-bold text-slate-900">{summary.totalExpectedEmpty ?? 0}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Actual delivery</p>
            <p className="text-lg font-bold text-slate-900">{summary.totalActualDelivery ?? 0}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Actual empty</p>
            <p className="text-lg font-bold text-slate-900">{summary.totalActualEmpty ?? 0}</p>
          </div>
          {(summary.deliveryVariance != null || summary.emptyVariance != null) && (
            <div className="col-span-2 md:col-span-4 flex gap-4 text-sm">
              <span className="text-slate-600">Delivery variance: <strong>{summary.deliveryVariance ?? 0}</strong></span>
              <span className="text-slate-600">Empty variance: <strong>{summary.emptyVariance ?? 0}</strong></span>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="px-4 py-3 font-semibold text-slate-800 border-b border-slate-200">Stops</h2>
        {(route.stops || []).length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No stops in this route.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Expected (del / empty)</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Actual (del / empty)</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Variance</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Payment</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Confirmed</th>
              </tr>
            </thead>
            <tbody>
              {(route.stops || []).map((s, i) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-500">{s.sequenceOrder ?? i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{s.customerName || '—'}</span>
                    {s.shopName && <span className="text-slate-500 ml-1">({s.shopName})</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.expectedDelivery ?? 0} / {s.expectedEmpty ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.actualDelivery != null ? s.actualDelivery : '—'} / {s.actualEmpty != null ? s.actualEmpty : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.deliveryVariance != null || s.emptyVariance != null ? (
                      <span className="text-slate-600">{s.deliveryVariance ?? 0} / {s.emptyVariance ?? 0}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.paymentStatus || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.confirmedAt ? s.confirmedAt : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
