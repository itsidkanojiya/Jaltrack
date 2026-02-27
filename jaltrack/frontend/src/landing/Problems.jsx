import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const problems = [
  { icon: 'calculate', text: 'Cash mismatch at month end' },
  { icon: 'search_off', text: 'Lost jugs with no proof of delivery' },
  { icon: 'notifications_off', text: 'Payment follow-ups forgotten' },
  { icon: 'local_gas_station', text: 'Fuel expenses completely untracked' },
  { icon: 'gavel', text: 'Billing arguments with customers' },
];

function AnimatedItem({ icon, text, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-red-50/60 border border-red-100"
    >
      <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-red-500 text-xl">{icon}</span>
      </div>
      <p className="text-base font-medium text-slate-700">{text}</p>
    </motion.div>
  );
}

export default function Problems() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider mb-4">The Problem</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Still Managing Your Business{' '}
            <span className="text-red-500">in a Diary or Excel?</span>
          </h2>
        </motion.div>

        <div className="space-y-3 max-w-xl mx-auto">
          {problems.map((p, i) => (
            <AnimatedItem key={p.text} icon={p.icon} text={p.text} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
