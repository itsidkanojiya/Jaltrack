import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    tag: 'Admin Dashboard',
    title: 'Full Business Control at a Glance',
    desc: '12 modules — from deliveries to profit. Everything an owner needs in one screen. Real-time data, zero guesswork.',
    icon: 'dashboard',
    gradient: 'from-blue-600 to-cyan-500',
    stats: ['127 Deliveries', '₹42K Revenue', '89 Customers'],
  },
  {
    tag: 'Delivery Boy Panel',
    title: 'Field-Ready. Under 30 Seconds.',
    desc: 'Tap, confirm, done. Designed for outdoor use — high contrast, big buttons, instant feedback. Works even on slow networks.',
    icon: 'local_shipping',
    gradient: 'from-green-600 to-emerald-500',
    stats: ['12 Pending', '5 Completed', '3 Empties'],
  },
  {
    tag: 'Client Portal',
    title: 'Transparency Builds Trust',
    desc: 'Your customers see their own bills, deliveries, and jug balance. No calls needed. Professional invoices, always available.',
    icon: 'storefront',
    gradient: 'from-purple-600 to-violet-500',
    stats: ['₹4,200 Bill', '5 Pending Jugs', '22 Deliveries'],
  },
];

function Feature({ f, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const isReversed = index % 2 !== 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className={`grid lg:grid-cols-2 gap-12 items-center ${isReversed ? 'lg:direction-rtl' : ''}`}
    >
      <div className={isReversed ? 'lg:order-2' : ''}>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r ${f.gradient} mb-4`}>
          {f.tag}
        </span>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">{f.title}</h3>
        <p className="text-base text-slate-500 leading-relaxed mb-6">{f.desc}</p>
        <div className="flex flex-wrap gap-3">
          {f.stats.map((s) => (
            <span key={s} className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{s}</span>
          ))}
        </div>
      </div>

      <div className={isReversed ? 'lg:order-1' : ''}>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className={`bg-gradient-to-br ${f.gradient} rounded-3xl p-8 shadow-2xl`}
        >
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined ms-fill text-white text-xl">{f.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{f.tag}</p>
                <p className="text-xs text-white/60">JalTrack</p>
              </div>
            </div>
            <div className="space-y-2">
              {f.stats.map((s, i) => (
                <div key={s} className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2.5">
                  <span className="text-sm text-white/80">{s.split(' ').slice(1).join(' ')}</span>
                  <span className="text-sm font-bold text-white">{s.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 space-y-24">
        {features.map((f, i) => <Feature key={f.tag} f={f} index={i} />)}
      </div>
    </section>
  );
}
