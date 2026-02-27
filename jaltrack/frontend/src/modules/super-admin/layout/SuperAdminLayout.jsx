import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const nav = [
  { to: '/super-admin', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/super-admin/businesses', icon: 'business', label: 'Businesses' },
  { to: '/super-admin/plans', icon: 'workspace_premium', label: 'Plans' },
  { to: '/super-admin/users', icon: 'group', label: 'Users' },
  { to: '/super-admin/leads', icon: 'contact_phone', label: 'Leads (CRM)' },
  { to: '/super-admin/analytics', icon: 'analytics', label: 'Analytics' },
  { to: '/super-admin/announcements', icon: 'campaign', label: 'Announcements' },
  { to: '/super-admin/logs', icon: 'history', label: 'Audit Logs' },
];

const linkClass = (isActive) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
  }`;

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/super-admin/login'); };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 shrink-0">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined ms-fill text-white text-sm">admin_panel_settings</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">JalTrack</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-lg ${isActive ? 'ms-fill' : ''}`}>{icon}</span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-red-400 hover:bg-red-500/10 transition-colors w-full">
            <span className="material-symbols-outlined text-lg">logout</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-sm font-bold text-slate-900">Super Admin Console</h1>
          <button onClick={handleLogout} className="md:hidden text-sm text-red-500 font-semibold">Logout</button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
