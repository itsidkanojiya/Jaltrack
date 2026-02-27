import { useState, useEffect } from 'react';
import { API } from '../../../core/apiBase';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Profit() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/profit`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">Loading...</p></div>;

  const d = data || { billing: 0, expenses: 0, salaries: 0, net: 0, breakdown: [] };

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-lg font-bold">Profit Summary</h1>
      <p className="text-sm text-slate-500 -mt-3">Monthly profit/loss overview</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
        <Row label="Total Billing" value={d.billing} bold />
        <Row label="Minus Expenses" value={-d.expenses} red />
        <Row label="Minus Salaries" value={-d.salaries} red />
        <div className="border-t border-slate-200 mt-3 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold">Net Profit</span>
            <span className={`text-xl font-bold ${d.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {d.net >= 0 ? '' : '-'}₹{Math.abs(d.net).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-sm">Detailed Breakdown</h3></div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60">
              <Th>Item</Th><Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(d.breakdown || []).map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5 text-sm">{r.label}</td>
                <td className={`px-6 py-3.5 text-sm font-semibold text-right ${r.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {r.amount < 0 ? '-' : '+'}₹{Math.abs(r.amount).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td className="px-6 py-3 text-sm font-bold">Net</td>
              <td className={`px-6 py-3 text-sm font-bold text-right ${d.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {d.net >= 0 ? '+' : '-'}₹{Math.abs(d.net).toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Row({ label, value, bold, red }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className={`text-sm ${bold ? 'font-semibold' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm font-semibold ${red ? 'text-red-600' : ''}`}>
        {value < 0 ? '-' : ''}₹{Math.abs(value).toLocaleString('en-IN')}
      </span>
    </div>
  );
}

function Th({ children, align }) {
  return <th className={`px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 ${align === 'right' ? 'text-right' : ''}`}>{children}</th>;
}
