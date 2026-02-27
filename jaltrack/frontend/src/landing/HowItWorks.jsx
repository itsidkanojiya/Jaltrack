import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const steps = [
  { num: '01', title: 'Add Customers', desc: 'Enter customer details, rates, and delivery schedule.', icon: 'person_add', color: 'from-blue-500 to-cyan-500' },
  { num: '02', title: 'Record Deliveries', desc: 'Delivery boys log jugs out and empties collected daily.', icon: 'local_shipping', color: 'from-green-500 to-emerald-500' },
  { num: '03', title: 'System Calculates', desc: 'Billing, jug balance, outstanding — all automated.', icon: 'calculate', color: 'from-purple-500 to-violet-500' },
  { num: '04', title: 'See Real Profit', desc: 'Revenue minus expenses, salaries, and losses.', icon: 'trending_up', color: 'from-orange-500 to-amber-500' },
];

function Step({ step, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative flex flex-col items-center text-center"
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl mb-5`}>
        <span className="material-symbols-outlined ms-fill text-white text-2xl">{step.icon}</span>
      </div>
      <span className="text-xs font-extrabold text-cyan-500 uppercase tracking-widest mb-2">Step {step.num}</span>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{step.desc}</p>
    </motion.div>
  );
}

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-cyan-50 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-4">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Four Steps to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Total Control</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200" />

          {steps.map((step, i) => <Step key={step.num} step={step} index={i} />)}
        </div>
      </div>
    </section>
  );
}
