import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: 'easeOut' },
});

const floatCards = [
  { label: 'Deliveries Today', value: '127', icon: 'local_shipping', color: 'from-blue-500 to-cyan-400', x: 0, y: 0, delay: 0.8 },
  { label: 'Revenue', value: '₹42,500', icon: 'payments', color: 'from-green-500 to-emerald-400', x: 60, y: 80, delay: 1.0 },
  { label: 'Pending Jugs', value: '38', icon: 'inventory_2', color: 'from-orange-500 to-amber-400', x: -40, y: 160, delay: 1.2 },
  { label: 'Active Customers', value: '89', icon: 'group', color: 'from-purple-500 to-violet-400', x: 30, y: 240, delay: 1.4 },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-violet-500/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <div>
          <motion.div {...fadeUp(0.2)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">Now serving 500+ water suppliers</span>
          </motion.div>

          <motion.h1 {...fadeUp(0.3)} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Control Your Water Jug Business{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Like Never Before.</span>
          </motion.h1>

          <motion.p {...fadeUp(0.5)} className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
            Deliveries. Billing. Expenses. Profit.
            <br />All automated. All in one system.
          </motion.p>

          <motion.div {...fadeUp(0.7)} className="mt-8 flex flex-wrap gap-4">
            <button className="px-7 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all">
              Start Free Trial
            </button>
            <Link to="/business/login" className="px-7 py-3.5 rounded-xl text-sm font-bold text-white border border-white/20 bg-white/5 backdrop-blur hover:bg-white/10 transition-all">
              Login to Dashboard →
            </Link>
          </motion.div>
        </div>

        {/* Floating dashboard mockup */}
        <div className="hidden lg:block relative h-[420px]">
          {floatCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: card.delay, ease: 'easeOut' }}
              className="absolute w-64"
              style={{ right: card.x, top: card.y }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                    <span className="material-symbols-outlined ms-fill text-white text-lg">{card.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 font-medium">{card.label}</p>
                    <p className="text-xl font-extrabold text-white">{card.value}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
