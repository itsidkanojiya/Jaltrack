import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_CONFIG = {
  admin: {
    title: 'Business Dashboard',
    subtitle: 'Manage your water jug business effortlessly',
    icon: 'business',
    gradient: 'from-blue-600 via-blue-700 to-indigo-800',
    accentGlow: 'bg-blue-500',
    buttonGrad: 'from-blue-600 to-indigo-600',
    focusRing: 'focus:ring-blue-500/30 focus:border-blue-500',
    features: [
      { icon: 'group', text: 'Manage Customers & Deliveries' },
      { icon: 'receipt_long', text: 'Auto Billing & Invoicing' },
      { icon: 'trending_up', text: 'Profit & Expense Tracking' },
      { icon: 'inventory_2', text: 'Jug Inventory Management' },
    ],
    floatingIcons: ['water_drop', 'payments', 'local_shipping', 'analytics', 'inventory_2'],
  },
  super_admin: {
    title: 'Super Admin',
    subtitle: 'Platform-wide control & monitoring center',
    icon: 'admin_panel_settings',
    gradient: 'from-slate-800 via-slate-900 to-violet-950',
    accentGlow: 'bg-violet-500',
    buttonGrad: 'from-violet-600 to-purple-700',
    focusRing: 'focus:ring-violet-500/30 focus:border-violet-500',
    features: [
      { icon: 'business', text: 'Multi-Business Management' },
      { icon: 'workspace_premium', text: 'Subscription & Plan Control' },
      { icon: 'analytics', text: 'Platform-wide Analytics' },
      { icon: 'shield', text: 'Security & Audit Logs' },
    ],
    floatingIcons: ['shield', 'admin_panel_settings', 'globe', 'database', 'security'],
  },
  delivery_boy: {
    title: 'Delivery Panel',
    subtitle: 'Your daily delivery companion',
    icon: 'local_shipping',
    gradient: 'from-cyan-600 via-blue-600 to-blue-800',
    accentGlow: 'bg-cyan-400',
    buttonGrad: 'from-cyan-600 to-blue-600',
    focusRing: 'focus:ring-cyan-500/30 focus:border-cyan-500',
    features: [
      { icon: 'checklist', text: 'Today\'s Delivery Schedule' },
      { icon: 'map', text: 'Route & Customer Info' },
      { icon: 'history', text: 'Delivery History & Records' },
      { icon: 'speed', text: 'Quick Spot Supply Entry' },
    ],
    floatingIcons: ['local_shipping', 'route', 'checklist', 'speed', 'location_on'],
  },
  client: {
    title: 'Client Portal',
    subtitle: 'Track your water supply & billing',
    icon: 'storefront',
    gradient: 'from-emerald-600 via-green-600 to-teal-700',
    accentGlow: 'bg-emerald-400',
    buttonGrad: 'from-emerald-600 to-teal-600',
    focusRing: 'focus:ring-emerald-500/30 focus:border-emerald-500',
    features: [
      { icon: 'receipt_long', text: 'View Bills & Invoices' },
      { icon: 'local_shipping', text: 'Track Deliveries' },
      { icon: 'support_agent', text: 'Raise Support Issues' },
      { icon: 'notifications', text: 'Holiday & Supply Alerts' },
    ],
    floatingIcons: ['storefront', 'receipt_long', 'water_drop', 'support_agent', 'notifications'],
  },
};

const ROLE_ROUTES = {
  admin: '/business',
  super_admin: '/super-admin',
  delivery_boy: '/delivery',
  client: '/client',
};

function FloatingIcon({ icon, delay, x, y, size, duration }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.15, 0.1, 0.15, 0],
        scale: [0.5, 1, 0.9, 1, 0.5],
        y: [0, -20, -10, -25, 0],
        rotate: [0, 10, -5, 8, 0],
      }}
      transition={{ duration: duration || 8, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span className={`material-symbols-outlined text-white text-${size || '4xl'}`}>{icon}</span>
    </motion.div>
  );
}

function WaterDroplets() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 rounded-full bg-white/10"
          style={{ left: `${15 + i * 14}%`, height: `${30 + Math.random() * 40}px` }}
          initial={{ top: '-10%', opacity: 0 }}
          animate={{ top: '110%', opacity: [0, 0.3, 0] }}
          transition={{ duration: 4 + i * 0.8, delay: i * 1.2, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

export default function Login({ expectedRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  const cfg = ROLE_CONFIG[expectedRole] || ROLE_CONFIG.admin;

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      if (expectedRole && data.user.role !== expectedRole) {
        if (!(expectedRole === 'admin' && data.user.role === 'super_admin')) {
          setError(`Access denied. This login is for ${cfg.title} only.`);
          setLoading(false);
          return;
        }
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const dest = ROLE_ROUTES[data.user.role] || '/business';
      navigate(dest, { replace: true });
    } catch {
      setError('Unable to connect to server');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel — Visual / Branding */}
      <div className={`relative hidden lg:flex lg:w-[55%] bg-gradient-to-br ${cfg.gradient} overflow-hidden`}>
        {/* Glowing orbs */}
        <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full ${cfg.accentGlow} opacity-20 blur-[100px]`} />
        <div className={`absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full ${cfg.accentGlow} opacity-10 blur-[120px]`} />
        <div className={`absolute top-1/2 left-1/3 w-64 h-64 rounded-full ${cfg.accentGlow} opacity-10 blur-[80px]`} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <WaterDroplets />

        {/* Floating icons */}
        {cfg.floatingIcons.map((icon, i) => (
          <FloatingIcon
            key={icon}
            icon={icon}
            delay={i * 1.5}
            x={10 + i * 18}
            y={15 + (i % 3) * 25}
            size={i === 0 ? '5xl' : '4xl'}
            duration={7 + i}
          />
        ))}

        {/* Main content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={mounted ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined ms-fill text-white text-2xl">water_drop</span>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">JalTrack</h2>
                <p className="text-xs text-white/50 font-semibold uppercase tracking-widest">{cfg.title}</p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
              Welcome to your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">{cfg.title}</span>
            </h1>

            <p className="text-base text-white/60 mb-10 max-w-md">{cfg.subtitle}</p>

            {/* Feature list */}
            <div className="space-y-4">
              {cfg.features.map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={mounted ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur border border-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white/80 text-lg">{f.icon}</span>
                  </div>
                  <span className="text-sm text-white/70 font-medium">{f.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-16 flex items-center gap-6"
          >
            <div className="flex -space-x-2">
              {['RK', 'VS', 'AK', 'SP'].map((initials, i) => (
                <div key={initials} className="w-8 h-8 rounded-full bg-white/15 backdrop-blur border-2 border-white/20 flex items-center justify-center text-[10px] font-bold text-white/80">
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-white/80">500+ businesses trust JalTrack</p>
              <p className="text-xs text-white/40">India's #1 water jug management platform</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className={`flex-1 flex flex-col relative bg-white lg:bg-slate-50`}>
        {/* Mobile gradient header */}
        <div className={`lg:hidden relative bg-gradient-to-br ${cfg.gradient} px-6 pt-14 pb-10 overflow-hidden`}>
          <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full ${cfg.accentGlow} opacity-20 blur-[60px]`} />
          <WaterDroplets />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined ms-fill text-white text-xl">water_drop</span>
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">JalTrack</span>
            </div>
            <h1 className="text-xl font-bold text-white">{cfg.title}</h1>
            <p className="text-sm text-white/60 mt-1">{cfg.subtitle}</p>
          </motion.div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-[400px]"
          >
            {/* Desktop logo (hidden on mobile since mobile has header) */}
            <div className="hidden lg:flex items-center gap-3 mb-2">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.buttonGrad} flex items-center justify-center text-white`}>
                <span className="material-symbols-outlined ms-fill text-xl">{cfg.icon}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{cfg.title}</h2>
                <p className="text-xs text-slate-400">Secure login</p>
              </div>
            </div>

            <h3 className="text-xl lg:text-2xl font-bold text-slate-900 mt-6 mb-1">Welcome back</h3>
            <p className="text-sm text-slate-500 mb-7">Enter your credentials to continue</p>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 overflow-hidden"
                >
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-red-500 text-lg mt-0.5">error</span>
                    <p className="text-sm text-red-700 font-medium leading-snug">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email or Username</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    {email.includes('@') ? 'mail' : 'person'}
                  </span>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com or username"
                    required
                    autoComplete="username"
                    className={`w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 ${cfg.focusRing} transition-all placeholder:text-slate-400`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-11 pr-12 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 ${cfg.focusRing} transition-all placeholder:text-slate-400`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full py-3.5 bg-gradient-to-r ${cfg.buttonGrad} text-white rounded-xl text-sm font-bold shadow-lg shadow-black/10 hover:shadow-xl transition-shadow disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="material-symbols-outlined text-lg"
                    >progress_activity</motion.span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Powered by <span className="font-bold text-slate-500">JalTrack</span> — India's smartest water jug platform
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
