import { useState, useEffect } from 'react';

const API = '/api';
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
}

function formatINR(n) {
  return Number(n || 0).toLocaleString('en-IN');
}

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const n = Math.floor(Math.abs(num));
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + numberToWords(n % 100) : '');
  if (n < 100000) return numberToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
  if (n < 10000000) return numberToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numberToWords(n % 100000) : '');
  return numberToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numberToWords(n % 10000000) : '');
}

function buildInvoiceHTML(inv) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const amountWords = numberToWords(Math.round(inv.finalAmount)) + ' Rupees Only';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${inv.invoiceNumber}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#f1f5f9;padding:20px}
  .invoice{max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:32px 40px;display:flex;justify-content:space-between;align-items:flex-start}
  .header h1{font-size:28px;font-weight:800;letter-spacing:-0.5px}
  .header .subtitle{font-size:12px;opacity:.7;margin-top:4px}
  .header .inv-info{text-align:right}
  .header .inv-number{font-size:14px;font-weight:700;background:rgba(255,255,255,.15);padding:6px 14px;border-radius:8px;display:inline-block;margin-bottom:8px}
  .header .inv-date{font-size:12px;opacity:.8}
  .body{padding:32px 40px}
  .parties{display:flex;justify-content:space-between;margin-bottom:28px;gap:40px}
  .party{flex:1}
  .party-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;margin-bottom:8px}
  .party-name{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:2px}
  .party-shop{font-size:13px;color:#3b82f6;font-weight:600;margin-bottom:4px}
  .party-detail{font-size:12px;color:#64748b;line-height:1.6}
  .period-badge{display:inline-flex;align-items:center;gap:6px;background:#eff6ff;color:#1d4ed8;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  thead th{background:#f8fafc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#64748b;padding:12px 16px;text-align:left;border-bottom:2px solid #e2e8f0}
  thead th.right{text-align:right}
  tbody td{padding:14px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9}
  tbody td.right{text-align:right;font-variant-numeric:tabular-nums}
  tbody tr:last-child td{border-bottom:none}
  .item-label{font-weight:500}
  .summary{display:flex;justify-content:flex-end;margin-bottom:24px}
  .summary-box{width:320px}
  .summary-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9}
  .summary-row.total{border-top:2px solid #1e40af;border-bottom:none;padding-top:12px;margin-top:4px}
  .summary-row.total .label,.summary-row.total .value{font-size:18px;font-weight:800;color:#1e40af}
  .summary-row .label{font-weight:500}
  .summary-row .value{font-weight:600;font-variant-numeric:tabular-nums}
  .summary-row.discount .value{color:#dc2626}
  .summary-row.additional .value{color:#16a34a}
  .words-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:24px}
  .words-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:4px}
  .words-text{font-size:13px;font-weight:600;color:#0f172a;font-style:italic}
  .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;display:flex;justify-content:space-between;align-items:flex-end}
  .footer .note{font-size:11px;color:#94a3b8;max-width:320px;line-height:1.5}
  .footer .stamp{text-align:center}
  .footer .stamp-line{width:180px;border-top:1px solid #cbd5e1;margin-bottom:6px}
  .footer .stamp-text{font-size:11px;font-weight:600;color:#64748b}
  .print-btn{position:fixed;bottom:24px;right:24px;background:#1e40af;color:#fff;border:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(30,64,175,.3);display:flex;align-items:center;gap:8px}
  .print-btn:hover{background:#1d4ed8}
  @media print{.print-btn{display:none!important}body{background:#fff;padding:0}.invoice{box-shadow:none;border-radius:0}}
</style></head><body>
<div class="invoice">
  <div class="header">
    <div>
      <h1>💧 ${inv.businessName}</h1>
      <div class="subtitle">${inv.businessAddress ? inv.businessAddress + (inv.businessCity ? ', ' + inv.businessCity : '') : 'Water Supply Services'}${inv.businessPhone ? ' • Ph: ' + inv.businessPhone : ''}</div>
    </div>
    <div class="inv-info">
      <div class="inv-number">${inv.invoiceNumber}</div>
      <div class="inv-date">Date: ${today}</div>
    </div>
  </div>
  <div class="body">
    <div class="parties">
      <div class="party">
        <div class="party-label">Bill To</div>
        <div class="party-name">${inv.customerName}</div>
        ${inv.shopName ? `<div class="party-shop">${inv.shopName}</div>` : ''}
        <div class="party-detail">
          ${inv.customerPhone ? 'Ph: ' + inv.customerPhone + '<br>' : ''}
          ${inv.customerAddress || ''}
        </div>
      </div>
      <div class="party" style="text-align:right">
        <div class="party-label">Invoice Details</div>
        <div class="party-detail">
          <strong>Invoice #:</strong> ${inv.invoiceNumber}<br>
          <strong>Period:</strong> ${inv.month}<br>
          <strong>Status:</strong> <span style="color:${inv.status === 'paid' ? '#16a34a' : '#f59e0b'};font-weight:600;text-transform:capitalize">${inv.status}</span>
        </div>
      </div>
    </div>
    <div class="period-badge">📅 Billing Period: ${inv.month}</div>
    <table>
      <thead>
        <tr><th>Description</th><th class="right">Qty / Days</th><th class="right">Rate (₹)</th><th class="right">Amount (₹)</th></tr>
      </thead>
      <tbody>
        <tr>
          <td class="item-label">Total Days in Month</td>
          <td class="right">${inv.totalDays}</td>
          <td class="right">—</td>
          <td class="right">—</td>
        </tr>
        <tr>
          <td class="item-label">Less: Supplier Holidays</td>
          <td class="right" style="color:#dc2626">-${inv.supplierHolidays}</td>
          <td class="right">—</td>
          <td class="right">—</td>
        </tr>
        ${inv.clientHolidays > 0 ? `<tr>
          <td class="item-label">Less: Client Holidays</td>
          <td class="right" style="color:#dc2626">-${inv.clientHolidays}</td>
          <td class="right">—</td>
          <td class="right">—</td>
        </tr>` : ''}
        <tr style="background:#f0f9ff">
          <td class="item-label" style="font-weight:700;color:#1e40af">Chargeable Days</td>
          <td class="right" style="font-weight:700;color:#1e40af">${inv.chargeableDays}</td>
          <td class="right" style="font-weight:600">₹${formatINR(inv.ratePerJug)}</td>
          <td class="right" style="font-weight:700;color:#1e40af">₹${formatINR(inv.baseAmount)}</td>
        </tr>
      </tbody>
    </table>
    <div class="summary">
      <div class="summary-box">
        <div class="summary-row"><span class="label">Base Amount</span><span class="value">₹${formatINR(inv.baseAmount)}</span></div>
        ${inv.discount > 0 ? `<div class="summary-row discount"><span class="label">Discount</span><span class="value">- ₹${formatINR(inv.discount)}</span></div>` : ''}
        ${inv.additionalCharges > 0 ? `<div class="summary-row additional"><span class="label">Additional Charges</span><span class="value">+ ₹${formatINR(inv.additionalCharges)}</span></div>` : ''}
        <div class="summary-row total"><span class="label">Total Payable</span><span class="value">₹${formatINR(inv.finalAmount)}</span></div>
      </div>
    </div>
    <div class="words-box">
      <div class="words-label">Amount in Words</div>
      <div class="words-text">${amountWords}</div>
    </div>
    ${inv.remarks ? `<div style="font-size:12px;color:#64748b;margin-bottom:16px"><strong>Remarks:</strong> ${inv.remarks}</div>` : ''}
  </div>
  <div class="footer">
    <div class="note">
      This is a computer-generated invoice.<br>
      Payment is due within 15 days of invoice date.<br>
      For queries contact: ${inv.businessPhone || 'your supplier'}
    </div>
    <div class="stamp">
      <div class="stamp-line"></div>
      <div class="stamp-text">Authorized Signatory</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:2px">${inv.businessName}</div>
    </div>
  </div>
</div>
<button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
</body></html>`;
}

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [adjusting, setAdjusting] = useState(null);
  const [adj, setAdj] = useState({ discount: '', additional: '', remarks: '' });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const load = () => {
    setLoading(true);
    fetch(`${API}/billing/invoices?month=${month}&year=${year}`, { headers: authHeaders() })
      .then((r) => r.json()).then((d) => setInvoices(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, [month, year]);

  const handleGenerate = () => {
    setGenerating(true);
    fetch(`${API}/billing/generate`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ month, year }) })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setInvoices(d); })
      .catch(console.error)
      .finally(() => setGenerating(false));
  };

  const handleAdjust = (id) => {
    fetch(`${API}/billing/invoices/${id}/adjust`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(adj) })
      .then((r) => r.json())
      .then((updated) => {
        if (updated) setInvoices((inv) => inv.map((i) => (i.id === id ? updated : i)));
        setAdjusting(null);
      })
      .catch(console.error);
  };

  const handleDownload = (invoiceId) => {
    fetch(`${API}/billing/invoices/${invoiceId}`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load invoice');
        return r.json();
      })
      .then((inv) => {
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(buildInvoiceHTML(inv));
        w.document.close();
      })
      .catch(console.error);
  };

  const handleDownloadAll = () => {
    invoices.forEach((inv, i) => {
      setTimeout(() => handleDownload(inv.id), i * 400);
    });
  };

  const totalAmount = invoices.reduce((s, r) => s + Number(r.final), 0);
  const curYear = now.getFullYear();
  const years = [curYear, curYear - 1, curYear - 2];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Billing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monthly billing cycle</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handleGenerate} disabled={generating} className="text-sm text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 hover:bg-slate-50 disabled:opacity-50">
            <span className="material-symbols-outlined text-[16px]">{generating ? 'progress_activity' : 'sync'}</span>
            {generating ? 'Generating...' : 'Generate Bills'}
          </button>
          {invoices.length > 0 && (
            <button onClick={handleDownloadAll} className="text-sm text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 hover:bg-slate-50">
              <span className="material-symbols-outlined text-[16px]">download</span> Download All
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Total Invoices" value={invoices.length} icon="receipt_long" color="bg-blue-50 text-blue-600" />
          <SummaryCard label="Total Billing" value={`₹${formatINR(totalAmount)}`} icon="payments" color="bg-green-50 text-green-600" />
          <SummaryCard label="Avg per Customer" value={`₹${formatINR(Math.round(totalAmount / invoices.length))}`} icon="person" color="bg-purple-50 text-purple-600" />
          <SummaryCard label="Period" value={`${MONTHS[month]} ${year}`} icon="calendar_month" color="bg-amber-50 text-amber-600" />
        </div>
      )}

      {/* Invoices table */}
      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-slate-300 text-4xl animate-pulse">hourglass_top</span>
            <p className="text-sm text-slate-400 mt-2">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-slate-300 text-5xl">receipt_long</span>
            <p className="text-sm text-slate-500 mt-3 font-medium">No invoices for {MONTHS[month]} {year}</p>
            <p className="text-xs text-slate-400 mt-1">Click "Generate Bills" to create invoices for all customers</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/60">
                  <Th>Customer</Th><Th align="right">Days</Th><Th align="right">Rate</Th><Th align="right">Total</Th><Th align="right">Discount</Th><Th align="right">Additional</Th><Th align="right">Final Amount</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((r) => (
                  <tr key={r.id} className={adjusting === r.id ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}>
                    <td className="px-6 py-3.5 text-sm font-semibold">{r.customer}</td>
                    <td className="px-6 py-3.5 text-sm text-right">{r.days}</td>
                    <td className="px-6 py-3.5 text-sm text-right">₹{r.rate}</td>
                    <td className="px-6 py-3.5 text-sm text-right">₹{formatINR(r.total)}</td>
                    <td className="px-6 py-3.5 text-sm text-right text-red-600">{r.discount ? `-₹${r.discount}` : '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-right text-green-600">{r.additional ? `+₹${r.additional}` : '—'}</td>
                    <td className="px-6 py-3.5 text-sm font-bold text-right">₹{formatINR(r.final)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex gap-1">
                        <button onClick={() => { setAdjusting(adjusting === r.id ? null : r.id); setAdj({ discount: '', additional: '', remarks: '' }); }}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary" title="Adjust">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDownload(r.id)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary" title="View Invoice">
                          <span className="material-symbols-outlined text-[18px]">receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="px-6 py-3 text-sm font-bold text-slate-700" colSpan={6}>Grand Total</td>
                  <td className="px-6 py-3 text-sm font-bold text-right text-primary">₹{formatINR(totalAmount)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
            {adjusting && (
              <div className="px-6 py-4 bg-blue-50/50 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Adjust Invoice</p>
                <div className="flex items-end gap-4 max-w-2xl">
                  <AdjField label="Discount (₹)" value={adj.discount} onChange={(e) => setAdj((a) => ({ ...a, discount: e.target.value }))} type="number" />
                  <AdjField label="Additional Charge (₹)" value={adj.additional} onChange={(e) => setAdj((a) => ({ ...a, additional: e.target.value }))} type="number" />
                  <AdjField label="Remarks" value={adj.remarks} onChange={(e) => setAdj((a) => ({ ...a, remarks: e.target.value }))} />
                  <button onClick={() => handleAdjust(adjusting)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold whitespace-nowrap">Apply</button>
                  <button onClick={() => setAdjusting(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-500 whitespace-nowrap">Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Th({ children, align }) {
  return <th className={`px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 ${align === 'right' ? 'text-right' : ''}`}>{children}</th>;
}

function AdjField({ label, value, onChange, type = 'text' }) {
  return (
    <div className="flex-1">
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
    </div>
  );
}

function SummaryCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

