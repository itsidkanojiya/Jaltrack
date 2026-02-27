import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API } from '../../../core/apiBase';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
}

const today = new Date().toISOString().slice(0, 10);

export default function RouteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';
  const [name, setName] = useState('');
  const [routeDate, setRouteDate] = useState(today);
  const [deliveryBoyIds, setDeliveryBoyIds] = useState([]);
  const [repeatDays, setRepeatDays] = useState(1);
  const [stops, setStops] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(!!isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/customers`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/salary/delivery-boys`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([c, a]) => {
        setCustomers(Array.isArray(c) ? c : []);
        setDeliveryBoys(Array.isArray(a) ? a : []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetch(`${API}/routes/${id}`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error('Route not found');
        return r.json();
      })
      .then((route) => {
        setName(route.name || '');
        setRouteDate(route.routeDateRaw || route.routeDate || today);
        setDeliveryBoyIds(
          route.deliveryBoyId != null ? [String(route.deliveryBoyId)] : []
        );
        setStops((route.stops || []).map((s) => ({
          customerId: String(s.customerId ?? ''),
          expectedDelivery: String(s.expectedDelivery ?? 0),
          expectedEmpty: String(s.expectedEmpty ?? 0),
        })));
      })
      .catch((err) => setError(err.message || 'Failed to load route'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const addStop = () => setStops((s) => [...s, { customerId: '', expectedDelivery: '0', expectedEmpty: '0' }]);
  const removeStop = (i) => setStops((s) => s.filter((_, idx) => idx !== i));
  const setStop = (i, key, value) => setStops((s) => s.map((stop, idx) => (idx === i ? { ...stop, [key]: value } : stop)));
  const moveUp = (i) => {
    if (i <= 0) return;
    setStops((s) => {
      const next = [...s];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };
  const moveDown = (i) => {
    if (i >= stops.length - 1) return;
    setStops((s) => {
      const next = [...s];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const ids = (deliveryBoyIds || []).filter((v) => v);
    if (ids.length === 0) {
      setError('Please select at least one delivery boy');
      setSaving(false);
      return;
    }

    const basePayload = {
      name: name || 'Unnamed Route',
      routeDate,
      stops: stops
        .filter((s) => s.customerId)
        .map((s) => ({
          customerId: Number(s.customerId),
          expectedDelivery: Number(s.expectedDelivery) || 0,
          expectedEmpty: Number(s.expectedEmpty) || 0,
        })),
    };

    const url = isEdit ? `${API}/routes/${id}` : `${API}/routes`;

    if (isEdit) {
      const payload = {
        ...basePayload,
        deliveryBoyId: Number(ids[0]),
      };
      fetch(url, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
        .then((r) => {
          if (!r.ok)
            return r.json().then((d) => {
              throw new Error(d.error || 'Failed to save route');
            });
          return r.json();
        })
        .then((updated) => {
          navigate(`/business/routes/${updated.id}`, { replace: true });
        })
        .catch((err) => setError(err.message || 'Failed to save route'))
        .finally(() => setSaving(false));
      return;
    }

    // Create: support multiple delivery boys and daily repetition
    const days = Math.min(Math.max(Number(repeatDays) || 1, 1), 31);
    const startDate = new Date(routeDate || today);

    const payloads = [];
    for (let d = 0; d < days; d += 1) {
      const dt = new Date(startDate);
      dt.setDate(dt.getDate() + d);
      const dateStr = dt.toISOString().slice(0, 10);
      ids.forEach((idVal) => {
        payloads.push({
          ...basePayload,
          routeDate: dateStr,
          deliveryBoyId: Number(idVal),
        });
      });
    }

    Promise.all(
      payloads.map((p) =>
        fetch(`${API}/routes`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(p),
        }).then((r) => {
          if (!r.ok)
            return r.json().then((d) => {
              throw new Error(d.error || 'Failed to create route');
            });
          return r.json();
        })
      )
    )
      .then(() => {
        navigate('/business/routes', { replace: true });
      })
      .catch((err) => setError(err.message || 'Failed to create routes'))
      .finally(() => setSaving(false));
  };

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading route...</p></div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/business/routes" className="text-slate-500 hover:text-slate-700">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-lg font-bold">{isEdit ? 'Edit route' : 'New route'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Plan delivery stops and assign delivery boy</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">error</span>{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Route name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Sector Tuesday"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Route date *</label>
            <input
              type="date"
              value={routeDate}
              onChange={(e) => setRouteDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Delivery boys * <span className="text-[10px] text-slate-400">(select one or more)</span>
            </label>
            <select
              multiple
              value={deliveryBoyIds}
              onChange={(e) =>
                setDeliveryBoyIds(Array.from(e.target.selectedOptions).map((o) => o.value))
              }
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 h-24"
            >
              {deliveryBoys.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Repeat daily for (days)</label>
            <input
              type="number"
              min="1"
              max="31"
              value={repeatDays}
              onChange={(e) => setRepeatDays(e.target.value)}
              disabled={isEdit}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              1 = only this date, 7 = create routes for a week.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-slate-700">Stops (order = sequence)</label>
            <button type="button" onClick={addStop} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">add</span> Add stop
            </button>
          </div>
          {stops.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No stops. Add at least one customer stop.</p>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 w-8">#</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700">Customer</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 w-28">Expected delivery</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 w-28">Expected empty</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 w-24">Order</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {stops.map((stop, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                      <td className="px-3 py-2">
                        <select
                          value={stop.customerId}
                          onChange={(e) => setStop(i, 'customerId', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                          <option value="">Select customer</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}{c.shopName ? ` (${c.shopName})` : ''}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={stop.expectedDelivery}
                          onChange={(e) => setStop(i, 'expectedDelivery', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={stop.expectedEmpty}
                          onChange={(e) => setStop(i, 'expectedEmpty', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-0.5">
                          <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40" title="Move up">
                            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                          </button>
                          <button type="button" onClick={() => moveDown(i)} disabled={i === stops.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40" title="Move down">
                            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeStop(i)} className="p-1 rounded hover:bg-red-50 text-red-600" title="Remove">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving...' : isEdit ? 'Update route' : 'Create route'}
          </button>
          <Link to="/business/routes" className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
