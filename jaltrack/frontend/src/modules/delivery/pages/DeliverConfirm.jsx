import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { API } from '../../../core/apiBase';

function authHeaders(includeJson = false) {
  const token = localStorage.getItem('token');
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  return includeJson ? { ...base, 'Content-Type': 'application/json' } : base;
}

export default function DeliverConfirm() {
  const { id } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customerId: '',
    jugsOut: '',
    emptyIn: '',
    paymentCollected: false,
    payment: 'Pending',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isNew) {
      fetch(`${API}/customers`, { headers: authHeaders() })
        .then((r) => r.json())
        .then((d) => setCustomers(Array.isArray(d) ? d : []))
        .catch((err) => {
          console.error(err);
          if (err?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/delivery/login';
          }
        });
    }
    if (loc.state && !isNew) {
      setForm((f) => ({
        ...f,
        customerId: loc.state.customerId || '',
        jugsOut: String(loc.state.jugsOut || ''),
        emptyIn: String(loc.state.emptyIn || ''),
      }));
    }
  }, []);

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: val };
      if (k === 'paymentCollected' && !val) next.payment = 'Pending';
      if (k === 'paymentCollected' && val && next.payment === 'Pending') next.payment = 'Cash';
      return next;
    });
  };

  const handleSubmit = () => {
    setSaving(true);
    fetch(`${API}/deliveries`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({
        customerId: form.customerId || null,
        jugsOut: form.jugsOut,
        emptyIn: form.emptyIn,
        payment: form.payment,
      }),
    })
      .then((r) => {
        if (r.ok) {
          setSuccess(true);
          setTimeout(() => navigate('/delivery'), 1500);
        } else if (r.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/delivery/login';
        }
      })
      .catch(console.error)
      .finally(() => setSaving(false));
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined ms-fill text-green-600 text-5xl">check_circle</span>
        </div>
        <p className="text-xl font-bold text-slate-900">Delivery Recorded</p>
        <p className="text-sm text-slate-500 mt-1">Redirecting...</p>
      </div>
    );
  }

  const customerName = loc.state?.customer || '';

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 font-medium mb-4 active:text-primary hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[20px]">arrow_back</span> Back
      </button>

      <div className="md:bg-white md:rounded-2xl md:border md:border-slate-200 md:p-8 md:shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
          {isNew ? 'New Delivery' : 'Confirm Delivery'}
        </h1>
        {customerName && <p className="text-sm text-primary font-semibold mb-5">{customerName}</p>}

        <div className="space-y-4 md:space-y-5">
          {/* Customer (only for new) */}
          {isNew && (
            <Field label="Customer">
              <select
                value={form.customerId}
                onChange={set('customerId')}
                className="w-full px-4 py-3.5 md:py-3 border-2 border-slate-200 rounded-xl text-base font-medium focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}

          {/* Jugs row — side by side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Jugs Delivered">
              <input
                type="number"
                inputMode="numeric"
                value={form.jugsOut}
                onChange={set('jugsOut')}
                placeholder="0"
                className="w-full px-4 py-3.5 md:py-3 border-2 border-slate-200 rounded-xl text-2xl md:text-xl font-bold text-center focus:outline-none focus:border-primary"
              />
            </Field>
            <Field label="Empty Jugs Collected">
              <input
                type="number"
                inputMode="numeric"
                value={form.emptyIn}
                onChange={set('emptyIn')}
                placeholder="0"
                className="w-full px-4 py-3.5 md:py-3 border-2 border-slate-200 rounded-xl text-2xl md:text-xl font-bold text-center focus:outline-none focus:border-primary"
              />
            </Field>
          </div>

          {/* Payment Toggle */}
          <div className="bg-white md:bg-slate-50 rounded-xl border-2 border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-700">Payment Collected?</span>
              <button
                type="button"
                role="switch"
                aria-checked={form.paymentCollected}
                onClick={() => set('paymentCollected')({ target: { type: 'checkbox', checked: !form.paymentCollected } })}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  form.paymentCollected ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    form.paymentCollected ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {form.paymentCollected && (
              <div className="flex gap-2 mt-3">
                {['Cash', 'UPI'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, payment: m }))}
                    className={`flex-1 py-3 md:py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      form.payment === m
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Remarks */}
          <Field label="Remarks (optional)">
            <input
              value={form.remarks}
              onChange={set('remarks')}
              placeholder="Any notes..."
              className="w-full px-4 py-3.5 md:py-3 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-primary"
            />
          </Field>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleSubmit}
          disabled={saving || (!form.jugsOut && !form.emptyIn)}
          className="w-full mt-6 py-4 md:py-3.5 bg-primary text-white rounded-2xl md:rounded-xl text-lg md:text-base font-bold active:scale-[0.98] md:active:scale-100 md:hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {saving ? 'Saving...' : 'Confirm Delivery'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
