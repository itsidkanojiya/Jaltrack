import { useState, useEffect } from 'react';
import { API } from '../../../core/apiBase';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function JugTracking() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/jug-tracking`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totals = data.reduce((t, r) => ({ delivered: t.delivered + r.delivered, collected: t.collected + r.collected, pending: t.pending + r.pending }), { delivered: 0, collected: 0, pending: 0 });

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading...</p></div>;

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-lg font-bold">Jug Tracking</h1>
      <p className="text-sm text-slate-500 -mt-3">Customer-wise inventory of jugs delivered vs returned</p>

      <div className="bg-white rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60">
              <Th>Customer</Th><Th align="right">Total Delivered</Th><Th align="right">Empty Collected</Th><Th align="right">Pending Jugs</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5 text-sm font-semibold">{r.customer}</td>
                <td className="px-6 py-3.5 text-sm text-right">{r.delivered}</td>
                <td className="px-6 py-3.5 text-sm text-right">{r.collected}</td>
                <td className="px-6 py-3.5 text-right">
                  <span className={`text-sm font-bold ${r.pending > 5 ? 'text-red-600' : r.pending > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {r.pending}
                  </span>
                  {r.pending > 5 && <span className="material-symbols-outlined text-red-500 text-[16px] align-middle ml-1">warning</span>}
                </td>
              </tr>
            ))}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="px-6 py-3 text-sm font-bold">Total</td>
                <td className="px-6 py-3 text-sm font-bold text-right">{totals.delivered}</td>
                <td className="px-6 py-3 text-sm font-bold text-right">{totals.collected}</td>
                <td className="px-6 py-3 text-sm font-bold text-right">{totals.pending}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function Th({ children, align }) {
  return <th className={`px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 ${align === 'right' ? 'text-right' : ''}`}>{children}</th>;
}
