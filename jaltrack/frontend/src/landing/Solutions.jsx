import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const solutions = [
  { icon: 'local_shipping', title: 'Smart Delivery Tracking', desc: 'Real-time tracking of every jug, every route.', color: 'from-blue-500 to-cyan-500' },
  { icon: 'receipt_long', title: 'Automatic Billing', desc: 'Monthly bills calculated with holiday rules.', color: 'from-green-500 to-emerald-500' },
  { icon: 'bolt', title: 'Spot Supply Mode', desc: 'Quick entry for emergency factory orders.', color: 'from-orange-500 to-amber-500' },
  { icon: 'celebration', title: 'Event Management', desc: 'Track wedding & event water supply.', color: 'from-pink-500 to-rose-500' },
  { icon: 'account_balance_wallet', title: 'Expense & Salary', desc: 'Fuel, maintenance, salary — all tracked.', color: 'from-purple-500 to-violet-500' },
  { icon: 'trending_up', title: 'Profit Calculation', desc: 'See real profit after all deductions.', color: 'from-cyan-500 to-teal-500' },
  { icon: 'notifications_active', title: 'Payment Reminders', desc: 'Never forget a pending payment again.', color: 'from-red-500 to-orange-500' },
  { icon: 'event_busy', title: 'Holiday Automation', desc: 'Auto-adjusts billing for holidays.', color: 'from-indigo-500 to-blue-500' },
];

function Card({ s, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
        <span className="material-symbols-outlined ms-fill text-white text-xl">{s.icon}</span>
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{s.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
    </motion.div>
  );
}

export default function Solutions() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-cyan-50 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-4">The Solution</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            JalTrack Removes Confusion.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Adds System Control.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {solutions.map((s, i) => <Card key={s.title} s={s} index={i} />)}
        </div>
      </div>
    </section>
  );
}
