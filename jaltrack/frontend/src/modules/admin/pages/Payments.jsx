import { useState, useEffect } from 'react';

const API = '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
}

const STATUS_STYLE = {
  Cleared: 'bg-green-50 text-green-700',
  Promised: 'bg-blue-50 text-blue-700',
  Pending: 'bg-orange-50 text-orange-700',
  Overdue: 'bg-red-50 text-red-700',
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAction, setActiveAction] = useState(null);
  // activeAction: { type: 'received' | 'promised', customerId, customerName, value }

  const load = () => {
    setError('');
    fetch(`${API}/payments`, { headers: authHeaders() })
      .then((r) => {
        if (r.status === 401) throw new Error('Please log in again.');
        return r.json();
      })
      .then((d) => setPayments(Array.isArray(d) ? d : []))
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load payments');
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markReceived = (customerId, customerName) => {
    setActiveAction({ type: 'received', customerId, customerName, value: '' });
  };

  const markPromised = (customerId, customerName) => {
    setActiveAction({ type: 'promised', customerId, customerName, value: '' });
  };

  const closeAction = () => setActiveAction(null);

  const submitAction = () => {
    if (!activeAction) return;
    const trimmed = String(activeAction.value || '').trim();
    if (!trimmed) return;

    if (activeAction.type === 'received') {
      const amount = Number(trimmed);
      if (!Number.isFinite(amount) || amount <= 0) return;
      fetch(`${API}/payments/${activeAction.customerId}/received`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ amount, mode: 'Cash' }),
      })
        .then(() => {
          closeAction();
          load();
        })
        .catch(console.error);
      return;
    }

    // promised
    fetch(`${API}/payments/${activeAction.customerId}/promised`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ promiseDate: trimmed }),
    })
      .then(() => {
        closeAction();
        load();
      })
      .catch(console.error);
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500">error</span>
            {error}
          </span>
          {error.includes('log in') && (
            <a href="/business/login" className="text-sm font-semibold text-primary hover:underline">
              Go to Login
            </a>
          )}
        </div>
      )}

      <h1 className="text-lg font-bold">Payments</h1>
      <p className="text-sm text-slate-500 -mt-3">Outstanding amounts & follow-ups</p>

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60">
              <Th>Customer</Th>
              <Th align="right">Outstanding</Th>
              <Th align="right">Days Pending</Th>
              <Th>Promise Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5 text-sm font-semibold">{r.customer}</td>
                <td
                  className={`px-6 py-3.5 text-sm font-semibold text-right ${
                    r.outstanding > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  ₹{Number(r.outstanding).toLocaleString('en-IN')}
                </td>
                <td
                  className={`px-6 py-3.5 text-sm text-right ${
                    r.daysPending > 30 ? 'text-red-600 font-semibold' : ''
                  }`}
                >
                  {r.daysPending}
                </td>
                <td className="px-6 py-3.5 text-sm text-slate-600">{r.promiseDate}</td>
                <td className="px-6 py-3.5">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      STATUS_STYLE[r.status] || ''
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex gap-1">
                    <button
                      onClick={() => markReceived(r.id, r.customer)}
                      className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      Mark Received
                    </button>
                    <button
                      onClick={() => markPromised(r.id, r.customer)}
                      className="px-3 py-1 text-xs font-medium text-primary border border-primary rounded hover:bg-primary/5"
                    >
                      Mark Promised
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeAction && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={closeAction}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {activeAction.type === 'received' ? 'Mark Payment Received' : 'Mark Payment Promised'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">{activeAction.customerName}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {activeAction.type === 'received'
                    ? 'Amount received (₹)'
                    : 'Promise date (YYYY-MM-DD)'}
                </label>
                <input
                  type={activeAction.type === 'received' ? 'number' : 'text'}
                  inputMode={activeAction.type === 'received' ? 'decimal' : 'text'}
                  value={activeAction.value}
                  onChange={(e) =>
                    setActiveAction((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={activeAction.type === 'received' ? '0' : '2026-02-27'}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={submitAction}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-60"
                disabled={!activeAction.value}
              >
                Save
              </button>
              <button
                type="button"
                onClick={closeAction}
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, align }) {
  return (
    <th
      className={`px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 ${
        align === 'right' ? 'text-right' : ''
      }`}
    >
      {children}
    </th>
  );
}
