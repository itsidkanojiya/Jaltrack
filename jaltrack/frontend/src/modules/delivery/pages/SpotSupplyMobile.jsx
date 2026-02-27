import { useState } from 'react';
import { API } from '../../../core/apiBase';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
}

const EMPTY = { location: '', jugs: '', mode: 'Cash', amount: '', notes: '' };

export default function SpotSupplyMobile() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    setSaving(true);
    fetch(`${API}/spot-supply`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(form),
    })
      .then((r) => {
        if (r.ok) {
          setSuccess(true);
          setForm(EMPTY);
          setTimeout(() => setSuccess(false), 2000);
        } else if (r.status === 401) {
          // Token missing or expired – force re-login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/delivery/login';
        }
      })
      .catch(console.error)
      .finally(() => setSaving(false));
  };

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-2xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Spot Supply</h1>
      <p className="text-sm text-slate-500 mb-5">Emergency factory / event supply</p>

      {success && (
        <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined ms-fill text-green-600 text-2xl">check_circle</span>
          <p className="text-sm font-bold text-green-700">Spot supply saved!</p>
        </div>
      )}

      <div className="md:bg-white md:rounded-2xl md:border md:border-slate-200 md:p-8 md:shadow-sm">
        <div className="space-y-4 md:space-y-5">
          {/* Location */}
          <Field label="Location / Factory">
            <input
              value={form.location}
              onChange={set('location')}
              placeholder="e.g. Verma Sweets, Main Market"
              className="w-full px-4 py-3.5 md:py-3 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-primary"
            />
          </Field>

          {/* Jugs + Amount side by side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Jugs Given">
              <input
                type="number"
                inputMode="numeric"
                value={form.jugs}
                onChange={set('jugs')}
                placeholder="0"
                className="w-full px-4 py-3.5 md:py-3 border-2 border-slate-200 rounded-xl text-2xl md:text-xl font-bold text-center focus:outline-none focus:border-primary"
              />
            </Field>
            <Field label="Amount (₹)">
              <input
                type="number"
                inputMode="numeric"
                value={form.amount}
                onChange={set('amount')}
                placeholder="0"
                className="w-full px-4 py-3.5 md:py-3 border-2 border-slate-200 rounded-xl text-2xl md:text-xl font-bold text-center focus:outline-none focus:border-primary"
              />
            </Field>
          </div>

          {/* Payment Mode */}
          <Field label="Payment Mode">
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'UPI', 'Pending'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, mode: m }))}
                  className={`py-3 md:py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    form.mode === m
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>

          {/* Notes */}
          <Field label="Notes (optional)">
            <input
              value={form.notes}
              onChange={set('notes')}
              placeholder="Any notes..."
              className="w-full px-4 py-3.5 md:py-3 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-primary"
            />
          </Field>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSubmit}
          disabled={saving || !form.location || !form.jugs}
          className="w-full mt-6 py-4 md:py-3.5 bg-primary text-white rounded-2xl md:rounded-xl text-lg md:text-base font-bold active:scale-[0.98] md:active:scale-100 md:hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {saving ? 'Saving...' : 'Save Spot Supply'}
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
