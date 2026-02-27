import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const nav = [
  { heading: null, items: [
    { to: '/business', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/business/customers', icon: 'group', label: 'Customers' },
    { to: '/business/deliveries', icon: 'local_shipping', label: 'Deliveries' },
    { to: '/business/spot-supply', icon: 'shopping_basket', label: 'Spot Supply' },
    { to: '/business/events', icon: 'event', label: 'Events' },
  ]},
  { heading: 'Financials', items: [
    { to: '/business/billing', icon: 'receipt_long', label: 'Billing' },
    { to: '/business/payments', icon: 'payments', label: 'Payments' },
    { to: '/business/expenses', icon: 'account_balance_wallet', label: 'Expenses' },
    { to: '/business/salary', icon: 'badge', label: 'Salary' },
  ]},
  { heading: 'Operations', items: [
    { to: '/business/routes', icon: 'route', label: 'Routes' },
    { to: '/business/holidays', icon: 'event_busy', label: 'Holidays' },
    { to: '/business/jug-tracking', icon: 'inventory_2', label: 'Jug Tracking' },
    { to: '/business/profit', icon: 'trending_up', label: 'Profit' },
  ]},
];

const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const linkClass = (isActive) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
    isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(months[now.getMonth()]);
  const [year] = useState(now.getFullYear());

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const initials = (user?.name || 'B').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/business/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 shrink-0 h-full overflow-y-auto">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined ms-fill text-lg">water_drop</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight">JalTrack</p>
            <p className="text-[11px] text-slate-400 leading-tight">Business Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1">
          {nav.map((section, si) => (
            <div key={si}>
              {section.heading && (
                <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {section.heading}
                </p>
              )}
              {section.items.map(({ to, icon, label, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
                  {({ isActive }) => (
                    <>
                      <span className={`material-symbols-outlined text-[20px] ${isActive ? 'ms-fill' : ''}`}>{icon}</span>
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.name || 'Business'}</p>
              <p className="text-[10px] text-slate-400">Business Owner</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors w-full">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-primary px-5 pt-10 pb-4 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined ms-fill text-lg">water_drop</span>
              </div>
              <div>
                <p className="text-base font-bold leading-tight">JalTrack</p>
                <p className="text-xs text-white/70">Business Dashboard</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-14 bg-white border-b border-slate-200 items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search orders, customers..."
                className="w-64 pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {months.map((m) => (
                <option key={m} value={m}>{m} {year}</option>
              ))}
            </select>
            <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
          </div>
        </header>

        {/* Mobile Bottom Nav */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50">
        {[
          { to: '/business', icon: 'dashboard', label: 'Home', end: true },
          { to: '/business/customers', icon: 'group', label: 'Customers' },
          { to: '/business/deliveries', icon: 'local_shipping', label: 'Delivery' },
          { to: '/business/billing', icon: 'receipt_long', label: 'Billing' },
          { to: '/business/profit', icon: 'trending_up', label: 'Profit' },
        ].map(({ to, icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-primary' : 'text-slate-400'
            }`
          }>
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[24px] ${isActive ? 'ms-fill' : ''}`}>{icon}</span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
