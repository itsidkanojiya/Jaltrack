import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const nav = [
  { to: '/client', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/client/billing', icon: 'receipt_long', label: 'Billing' },
  { to: '/client/deliveries', icon: 'local_shipping', label: 'Deliveries' },
  { to: '/client/issues', icon: 'support_agent', label: 'Issues' },
];

const linkClass = (isActive) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
    isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

const mobileLinkClass = (isActive) =>
  `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
    isActive ? 'text-primary' : 'text-slate-400'
  }`;

export default function ClientLayout() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const initials = (user?.name || 'CL').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/client/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 shrink-0 h-full">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined ms-fill text-lg">storefront</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight">JalTrack</p>
            <p className="text-[11px] text-slate-400 leading-tight">Client Portal</p>
          </div>
        </div>

        {user && (
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.name || user.email}</p>
            <p className="text-[11px] text-slate-400">Client Account</p>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'ms-fill' : ''}`}>{icon}</span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors w-full">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-green-600 px-5 pt-10 pb-4 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined ms-fill text-lg">storefront</span>
              </div>
              <div>
                <p className="text-base font-bold leading-tight">JalTrack</p>
                <p className="text-xs text-white/70">Client Portal</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-14 bg-white border-b border-slate-200 items-center justify-between px-6 shrink-0">
          <p className="text-sm font-semibold text-slate-700">Client Portal</p>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">{user?.name || 'Client'}</p>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50">
        {nav.map(({ to, icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => mobileLinkClass(isActive)}>
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
