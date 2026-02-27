import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const nav = [
  { to: '/delivery', icon: 'today', label: 'Today', end: true },
  { to: '/delivery/spot', icon: 'bolt', label: 'Spot Supply' },
  { to: '/delivery/history', icon: 'history', label: 'History' },
];

const linkClass = (isActive) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
  }`;

const mobileLinkClass = (isActive) =>
  `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
    isActive ? 'text-primary' : 'text-slate-400'
  }`;

export default function DeliveryLayout() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/delivery/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="px-5 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined ms-fill text-white text-xl">local_shipping</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 leading-tight">JalTrack</p>
              <p className="text-xs text-slate-400">Delivery Panel</p>
            </div>
          </div>
        </div>

        {user && (
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">person</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.fullName || user.email}</p>
                <p className="text-xs text-slate-400">Delivery Boy</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-xl ${isActive ? 'ms-fill' : ''}`}>{icon}</span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors w-full">
            <span className="material-symbols-outlined text-xl">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-primary px-5 pt-10 pb-4 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined ms-fill text-[22px]">local_shipping</span>
              </div>
              <div>
                <p className="text-base font-bold leading-tight">JalTrack</p>
                <p className="text-xs text-white/70">Delivery Panel</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white border-b border-slate-200 shrink-0">
          <h1 className="text-lg font-bold text-slate-900">Delivery Panel</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{user?.fullName || 'Delivery Boy'}</p>
              <p className="text-xs text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">person</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50 safe-area-pb">
        {nav.map(({ to, icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => mobileLinkClass(isActive)}>
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[26px] ${isActive ? 'ms-fill' : ''}`}>{icon}</span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
