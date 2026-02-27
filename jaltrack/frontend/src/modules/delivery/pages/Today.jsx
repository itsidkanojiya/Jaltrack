import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = '/api';
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
}

function fmtToday() {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default function Today() {
  const [deliveries, setDeliveries] = useState([]);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmingStop, setConfirmingStop] = useState(null);
  const [confirmForm, setConfirmForm] = useState({ actualDeliveryQty: '', actualEmptyQty: '', paymentCollected: false, paymentStatus: 'Cash', notes: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const loadToday = () => {
    Promise.all([
      fetch(`${API}/delivery-boy/today`, { headers: authHeaders() }).then((r) => r.json()).catch(() => ({ deliveries: [] })),
      fetch(`${API}/delivery-boy/routes/today`, { headers: authHeaders() }).then((r) => r.json()).catch(() => ({ route: null })),
    ])
      .then(([todayRes, routeRes]) => {
        const list = todayRes.deliveries ?? (Array.isArray(todayRes) ? todayRes : []);
        setDeliveries(Array.isArray(list) ? list : []);
        const r = routeRes.id && routeRes.stops ? routeRes : routeRes.route;
        setRoute(r || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(loadToday, []);

  const pending = deliveries.filter((d) => d.payment === 'Pending' || d.payment === undefined);
  const done = deliveries.filter((d) => d.payment && d.payment !== 'Pending');

  const openConfirm = (stop) => {
    setConfirmingStop(stop);
    setConfirmForm({
      actualDeliveryQty: String(stop.expectedDelivery ?? ''),
      actualEmptyQty: String(stop.expectedEmpty ?? ''),
      paymentCollected: false,
      paymentStatus: 'Cash',
      notes: '',
    });
  };

  const closeConfirm = () => {
    setConfirmingStop(null);
  };

  const submitConfirm = () => {
    if (!route || !confirmingStop) return;
    setSaving(true);
    const payload = {
      actualDeliveryQty: Number(confirmForm.actualDeliveryQty) || 0,
      actualEmptyQty: Number(confirmForm.actualEmptyQty) || 0,
      paymentStatus: confirmForm.paymentCollected ? (confirmForm.paymentStatus || 'Cash') : 'Pending',
      notes: confirmForm.notes || undefined,
    };
    fetch(`${API}/delivery-boy/routes/${route.id}/stops/${confirmingStop.id}/confirm`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        closeConfirm();
        loadToday();
      })
      .catch((err) => console.error(err))
      .finally(() => setSaving(false));
  };

  const setConfirm = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setConfirmForm((f) => ({ ...f, [k]: val }));
  };

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-5xl mx-auto">
      {/* Date & Summary */}
      <div className="mb-5 md:mb-6 md:flex md:items-end md:justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{fmtToday()}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{route ? route.stops?.length : deliveries.length}</h1>
            <span className="text-base text-slate-500">{route ? 'stops on route' : 'deliveries today'}</span>
          </div>
        </div>
        {!route && (
          <button
            onClick={() => navigate('/delivery/deliver/new')}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            New Delivery
          </button>
        )}
      </div>

      {loading && <p className="text-center text-sm text-slate-400 py-8">Loading...</p>}

      {/* Today's Route (planned) */}
      {!loading && route && route.stops && route.stops.length > 0 && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">route</span>
            <h2 className="text-lg font-bold text-slate-900">Today&apos;s Route — {route.name}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-8">
            {route.stops.map((stop, idx) => (
              <div
                key={stop.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-slate-900">{stop.customerName || 'Customer'}</p>
                    {stop.shopName && <p className="text-sm text-slate-500">{stop.shopName}</p>}
                    {stop.address && <p className="text-xs text-slate-400 mt-0.5 truncate">{stop.address}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Tag label={`${stop.expectedDelivery ?? 0} deliver`} color="bg-blue-50 text-blue-700" />
                      <Tag label={`${stop.expectedEmpty ?? 0} empty`} color="bg-slate-100 text-slate-600" />
                      {stop.pendingJugs != null && <Tag label={`${stop.pendingJugs} pending jugs`} color="bg-amber-50 text-amber-700" />}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {stop.confirmedAt ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span> Done
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openConfirm(stop)}
                        className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-xl text-sm font-bold"
                      >
                        <span className="material-symbols-outlined text-[18px]">check</span> Confirm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick Stats (when no route or in addition) */}
      {!loading && !route && (
        <>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-4 mb-6">
            <StatPill icon="check_circle" value={done.length} label="Done" color="text-green-600 bg-green-50" />
            <StatPill icon="schedule" value={pending.length} label="Pending" color="text-orange-600 bg-orange-50" />
            <StatPill icon="inventory_2" value={deliveries.reduce((s, d) => s + (d.jugsOut || 0) - (d.emptyIn || 0), 0)} label="Jugs Out" color="text-blue-600 bg-blue-50" />
          </div>

          {deliveries.length === 0 && (
            <div className="text-center py-12 md:py-20">
              <span className="material-symbols-outlined text-slate-300 text-5xl md:text-6xl">inventory</span>
              <p className="text-slate-400 mt-2 text-sm md:text-base">No deliveries assigned today</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {deliveries.map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/delivery/deliver/${d.id}`, { state: d })}
                className="w-full bg-white rounded-2xl border border-slate-200 p-4 md:p-5 text-left hover:shadow-md hover:border-slate-300 active:scale-[0.98] md:active:scale-100 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{d.customer}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{d.date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-lg font-bold text-primary">{d.jugsOut ?? 0}</span>
                    <span className="material-symbols-outlined text-slate-300 text-[20px] group-hover:text-primary transition-colors">chevron_right</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-2.5">
                  <Tag label={`${d.jugsOut ?? 0} out`} color="bg-blue-50 text-blue-700" />
                  <Tag label={`${d.emptyIn ?? 0} empty`} color="bg-slate-100 text-slate-600" />
                  <Tag label={d.payment || 'Pending'} color={d.payment === 'Pending' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Confirm stop modal */}
      {confirmingStop && route && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeConfirm}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Confirm delivery</h3>
            <p className="text-sm text-slate-500 mb-4">{confirmingStop.customerName}{confirmingStop.shopName ? ` (${confirmingStop.shopName})` : ''}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Delivered (jugs)</label>
                <input
                  type="number"
                  min="0"
                  value={confirmForm.actualDeliveryQty}
                  onChange={setConfirm('actualDeliveryQty')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Empty collected</label>
                <input
                  type="number"
                  min="0"
                  value={confirmForm.actualEmptyQty}
                  onChange={setConfirm('actualEmptyQty')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pay" checked={confirmForm.paymentCollected} onChange={setConfirm('paymentCollected')} className="rounded border-slate-300" />
                <label htmlFor="pay" className="text-sm font-medium text-slate-700">Payment collected</label>
              </div>
              {confirmForm.paymentCollected && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Payment mode</label>
                  <select value={confirmForm.paymentStatus} onChange={setConfirm('paymentStatus')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={confirmForm.notes}
                  onChange={setConfirm('notes')}
                  placeholder="Remarks"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={submitConfirm} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={closeConfirm} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB — only when no route */}
      {!loading && !route && (
        <button
          onClick={() => navigate('/delivery/deliver/new')}
          className="md:hidden fixed bottom-20 right-4 w-16 h-16 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform z-40"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      )}
    </div>
  );
}

function StatPill({ icon, value, label, color }) {
  return (
    <div className={`rounded-xl p-3 md:p-4 text-center ${color}`}>
      <span className="material-symbols-outlined text-[20px] md:text-[24px]">{icon}</span>
      <p className="text-xl md:text-2xl font-bold mt-0.5">{value}</p>
      <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide">{label}</p>
    </div>
  );
}

function Tag({ label, color }) {
  return <span className={`text-[11px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ${color}`}>{label}</span>;
}
