import { useState, useEffect } from 'react';
import { API as API_BASE } from '../../../core/apiBase';

const API = `${API_BASE}/client`;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

export default function ClientBilling() {
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBilling = (y) => {
    setLoading(true);
    setError('');
    fetch(`${API}/billing?year=${y}`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Access denied. Your account may not be linked to a customer yet.' : 'Failed to load billing data');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBilling(year); }, [year]);

  const handleDownload = (invoiceId) => {
    fetch(`${API}/invoice/${invoiceId}`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load invoice');
        return r.json();
      })
      .then((inv) => {
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<html><head><title>Invoice - ${inv.month}</title>
          <style>body{font-family:system-ui,sans-serif;padding:40px;max-width:700px;margin:auto}
          h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:20px}
          th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e2e8f0}
          th{font-size:12px;text-transform:uppercase;color:#64748b}
          .total{font-weight:bold;font-size:18px}</style></head><body>
          <h1>JalTrack Invoice</h1>
          <p><strong>${inv.customerName}</strong><br/>${inv.address || ''}</p>
          <p>Period: <strong>${inv.month}</strong></p>
          <table><tr><th>Item</th><th>Value</th></tr>
          <tr><td>Total Days</td><td>${inv.totalDays}</td></tr>
          <tr><td>Supplier Holidays</td><td>${inv.supplierHolidays}</td></tr>
          <tr><td>Client Holidays</td><td>${inv.clientHolidays}</td></tr>
          <tr><td>Chargeable Days</td><td>${inv.chargeableDays}</td></tr>
          <tr><td>Rate per Jug</td><td>₹${inv.ratePerJug}</td></tr>
          <tr><td>Base Amount</td><td>₹${inv.baseAmount}</td></tr>
          <tr><td>Discount</td><td>-₹${inv.discount}</td></tr>
          <tr><td>Additional Charges</td><td>+₹${inv.additionalCharges}</td></tr>
          <tr><td class="total">Final Amount</td><td class="total">₹${inv.finalAmount}</td></tr>
          </table></body></html>`);
        w.document.close();
        w.print();
      })
      .catch(console.error);
  };

  const curYear = new Date().getFullYear();
  const years = [curYear, curYear - 1, curYear - 2];
  const invoices = data?.invoices || [];

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500">Monthly invoices & payment history</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <span className="material-symbols-outlined text-slate-300 text-4xl animate-pulse">hourglass_top</span>
            <p className="text-sm text-slate-400 mt-2">Loading billing...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-500 text-xl mt-0.5">error</span>
          <div>
            <p className="text-sm font-bold text-red-800 mb-1">Unable to Load Billing</p>
            <p className="text-sm text-red-600 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-12">
          <span className="material-symbols-outlined text-slate-300 text-5xl">receipt_long</span>
          <p className="text-sm text-slate-400 mt-3">No invoices for {year}</p>
        </div>
      )}

      {/* Mobile card view */}
      {!loading && !error && invoices.length > 0 && (
        <>
          <div className="md:hidden space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-900">{inv.month}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    inv.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                  }`}>{inv.status || 'Pending'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-xs text-slate-400">Days</p>
                    <p className="font-semibold text-slate-700">{inv.chargeableDays ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Rate</p>
                    <p className="font-semibold text-slate-700">₹{Number(inv.rate || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Discount</p>
                    <p className="font-semibold text-slate-700">{Number(inv.discount || 0) > 0 ? `-₹${Number(inv.discount).toLocaleString('en-IN')}` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Additional</p>
                    <p className="font-semibold text-slate-700">{Number(inv.additionalCharges || 0) > 0 ? `+₹${Number(inv.additionalCharges).toLocaleString('en-IN')}` : '—'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400">Final Amount</p>
                    <p className="text-lg font-bold text-slate-900">₹{Number(inv.finalAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <button onClick={() => handleDownload(inv.id)} className="flex items-center gap-1 text-primary text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Month</th>
                  <th className="px-5 py-3 font-semibold">Days</th>
                  <th className="px-5 py-3 font-semibold">Rate</th>
                  <th className="px-5 py-3 font-semibold">Discount</th>
                  <th className="px-5 py-3 font-semibold">Additional</th>
                  <th className="px-5 py-3 font-semibold">Final Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-700">{inv.month}</td>
                    <td className="px-5 py-3 text-slate-600">{inv.chargeableDays ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600">₹{Number(inv.rate || 0).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3 text-slate-600">{Number(inv.discount || 0) > 0 ? `-₹${Number(inv.discount).toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{Number(inv.additionalCharges || 0) > 0 ? `+₹${Number(inv.additionalCharges).toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">₹{Number(inv.finalAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        inv.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                      }`}>{inv.status || 'Pending'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDownload(inv.id)} className="text-primary hover:text-primary-dark text-xs font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
