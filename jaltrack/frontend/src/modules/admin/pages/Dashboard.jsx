import { useState, useEffect } from 'react';
import { API } from '../../../core/apiBase';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function formatINR(n) { return Number(n || 0).toLocaleString('en-IN'); }

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = MONTHS[now.getMonth() + 1];
  const currentYear = now.getFullYear();

  useEffect(() => {
    Promise.all([
      fetch(`${API}/dashboard/stats`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/dashboard/analytics`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/dashboard/activity?limit=10`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([s, a, act]) => { setStats(s); setAnalytics(a); setActivity(Array.isArray(act) ? act : []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-slate-300 text-4xl animate-pulse">hourglass_top</span>
      </div>
    );
  }

  const s = stats || {};
  const a = analytics || {};
  const rev = a.revenue || {};
  const jugFlow = a.jugFlow || {};

  return (
    <div className="p-5 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">{currentMonth} {currentYear} Overview</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span className="material-symbols-outlined text-sm">schedule</span>
          Last updated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Today's Deliveries" value={s.todayDeliveries ?? 0} sub={`/ ${s.todayTarget ?? 60}`} icon="local_shipping" color="bg-blue-500" badge={`${s.deliveryPercent ?? 0}%`} />
        <KpiCard label="Spot Supply" value={`${s.spotSupplyJugs ?? 0} Jugs`} icon="shopping_basket" color="bg-purple-500" />
        <KpiCard label="Pending Jugs" value={s.pendingEmptyJugs ?? 0} icon="inventory_2" color="bg-amber-500" />
        <KpiCard label="Outstanding" value={`₹${formatINR(s.outstanding)}`} icon="warning" color="bg-red-500" trend="down" />
        <KpiCard label="Cash Collected" value={`₹${formatINR(s.cashCollected)}`} icon="account_balance" color="bg-emerald-500" trend="up" />
      </div>

      {/* Revenue & Profit Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined ms-fill text-white/80">payments</span>
            <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Monthly Revenue</h3>
          </div>
          <p className="text-3xl font-extrabold mb-1">₹{formatINR(rev.totalRevenue)}</p>
          <p className="text-xs text-white/60 mb-4">{currentMonth} {currentYear}</p>
          <div className="space-y-2">
            <RevenueRow label="Customer Billing" value={rev.billing} total={rev.totalRevenue || 1} />
            <RevenueRow label="Spot Supply" value={rev.spot} total={rev.totalRevenue || 1} />
          </div>
        </div>

        {/* Profit / Loss */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className={`material-symbols-outlined ms-fill ${rev.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {rev.profit >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Profit & Loss</h3>
          </div>
          <p className={`text-3xl font-extrabold ${rev.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {rev.profit >= 0 ? '+' : ''}₹{formatINR(rev.profit)}
          </p>
          <p className="text-xs text-slate-400 mb-4">Net this month</p>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Revenue" value={`₹${formatINR(rev.totalRevenue)}`} color="text-emerald-600" icon="arrow_upward" />
            <MiniStat label="Expenses" value={`₹${formatINR(rev.totalExpenses)}`} color="text-red-500" icon="arrow_downward" />
            <MiniStat label="Salaries" value={`₹${formatINR(rev.salaries)}`} color="text-amber-600" icon="badge" />
            <MiniStat label="Collected" value={`₹${formatINR(rev.collected)}`} color="text-blue-600" icon="account_balance_wallet" />
          </div>
        </div>

        {/* Jug Flow */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined ms-fill text-cyan-500">water_drop</span>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Jug Flow</h3>
          </div>
          <div className="flex items-center justify-center mb-4">
            <DonutChart out={jugFlow.out || 0} returned={jugFlow.returned || 0} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <p className="text-xs text-slate-500 font-medium">Sent Out</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{jugFlow.out}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <p className="text-xs text-slate-500 font-medium">Returned</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{jugFlow.returned}</p>
            </div>
          </div>
          {jugFlow.out > 0 && (
            <p className="text-center text-xs text-slate-400 mt-2">
              {Math.round((jugFlow.returned / jugFlow.out) * 100)}% return rate
            </p>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Deliveries Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">bar_chart</span>
              <h3 className="text-sm font-bold text-slate-700">Last 7 Days — Deliveries</h3>
            </div>
          </div>
          <BarChart data={a.weeklyDeliveries || []} valueKey="jugs" labelKey="day" color="bg-blue-500" />
        </div>

        {/* Monthly Growth */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">show_chart</span>
              <h3 className="text-sm font-bold text-slate-700">6-Month Growth</h3>
            </div>
          </div>
          <BarChart data={a.monthlyGrowth || []} valueKey="jugs" labelKey="month" color="bg-emerald-500" />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Customers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-amber-500">emoji_events</span>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Top Customers</h3>
          </div>
          {(a.topCustomers || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-3">
              {(a.topCustomers || []).map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-slate-300'
                  }`}>{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                    {c.shopName && <p className="text-[11px] text-slate-400 truncate">{c.shopName}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{c.totalJugs}</p>
                    <p className="text-[10px] text-slate-400">jugs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-red-400">pie_chart</span>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Expense Breakdown</h3>
          </div>
          {(a.expenseBreakdown || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No expenses this month</p>
          ) : (
            <div className="space-y-3">
              {(a.expenseBreakdown || []).map((e, i) => {
                const totalExp = (a.expenseBreakdown || []).reduce((s, x) => s + x.amount, 0) || 1;
                const pct = Math.round((e.amount / totalExp) * 100);
                const colors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-slate-400'];
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{e.category}</span>
                      <span className="text-slate-500">₹{formatINR(e.amount)} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-violet-500">insights</span>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Business Health</h3>
          </div>
          <div className="space-y-4">
            <HealthItem
              label="Total Customers"
              value={a.customerStats?.total ?? 0}
              icon="group" color="text-blue-500"
            />
            <HealthItem
              label="With Outstanding"
              value={a.customerStats?.withOutstanding ?? 0}
              icon="warning" color="text-red-500"
              sub={a.customerStats?.total ? `${Math.round(((a.customerStats?.withOutstanding ?? 0) / a.customerStats.total) * 100)}% of customers` : ''}
            />
            <HealthItem
              label="Delivery Success"
              value={`${s.deliverySuccessRate ?? 0}%`}
              icon="verified" color="text-emerald-500"
            />
            <HealthItem
              label="Jug Return Rate"
              value={`${s.emptyJugReturnRate ?? 0}%`}
              icon="recycling" color="text-cyan-500"
            />
            <HealthItem
              label="Collection Rate"
              value={rev.totalRevenue > 0 ? `${Math.round((rev.collected / rev.totalRevenue) * 100)}%` : '0%'}
              icon="account_balance_wallet" color="text-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">history</span>
            <h3 className="text-sm font-bold text-slate-700">Recent Activity</h3>
          </div>
        </div>
        {activity.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-slate-300 text-4xl">inbox</span>
            <p className="text-sm text-slate-400 mt-2">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activity.map((r, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/50">
                <TypeBadge type={r.type} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{r.customer || 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{r.dateTime}</p>
                </div>
                <p className="text-sm font-bold text-slate-700 shrink-0">{r.amount}</p>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, color, badge, trend }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <span className="material-symbols-outlined ms-fill text-white text-lg">{icon}</span>
        </div>
        {badge && <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{badge}</span>}
        {trend === 'up' && <span className="material-symbols-outlined text-emerald-500 text-lg">trending_up</span>}
        {trend === 'down' && <span className="material-symbols-outlined text-red-500 text-lg">trending_down</span>}
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-xl font-extrabold text-slate-900 mt-0.5">
        {value}{sub && <span className="text-sm text-slate-400 font-normal">{sub}</span>}
      </p>
    </div>
  );
}

function RevenueRow({ label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/70">{label}</span>
        <span className="text-white font-bold">₹{formatINR(value)}</span>
      </div>
      <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
        <div className="h-full bg-white/40 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, icon }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`material-symbols-outlined text-sm ${color}`}>{icon}</span>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DonutChart({ out, returned }) {
  const total = out || 1;
  const pct = Math.round((returned / total) * 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#10b981" strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-extrabold text-slate-900">{pct}%</span>
      </div>
    </div>
  );
}

function BarChart({ data, valueKey, labelKey, color }) {
  if (!data.length) return <p className="text-sm text-slate-400 text-center py-8">No data available</p>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);

  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d, i) => {
        const pct = Math.max(((d[valueKey] || 0) / max) * 100, 2);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-slate-600">{d[valueKey] || 0}</span>
            <div className="w-full bg-slate-100 rounded-t-md overflow-hidden" style={{ height: '100px' }}>
              <div
                className={`w-full ${color} rounded-t-md transition-all duration-700`}
                style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function HealthItem({ label, value, icon, color, sub }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center ${color} shrink-0`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TypeBadge({ type }) {
  const config = {
    Delivery: { icon: 'local_shipping', bg: 'bg-blue-50', text: 'text-blue-600' },
    'Spot Supply': { icon: 'shopping_basket', bg: 'bg-purple-50', text: 'text-purple-600' },
    Payment: { icon: 'payments', bg: 'bg-green-50', text: 'text-green-600' },
  };
  const c = config[type] || { icon: 'info', bg: 'bg-slate-50', text: 'text-slate-600' };
  return (
    <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
      <span className={`material-symbols-outlined text-lg ${c.text}`}>{c.icon}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    Completed: 'bg-green-50 text-green-700',
    Received: 'bg-green-50 text-green-700',
    Paid: 'bg-green-50 text-green-700',
    Pending: 'bg-amber-50 text-amber-700',
    Cash: 'bg-emerald-50 text-emerald-700',
    UPI: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
