import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const plans = [
  {
    name: 'Starter',
    tagline: 'Perfect for small water suppliers',
    originalPrice: 599,
    offerPrice: 299,
    period: '/month',
    popular: false,
    features: [
      { label: 'Up to 50 Customers', on: true },
      { label: '1 Delivery Route', on: true },
      { label: 'Monthly Billing', on: true },
      { label: 'Jug Tracking', on: false },
      { label: 'GST Invoice', on: false },
      { label: 'Reports Export', on: true, note: 'Basic' },
      { label: 'WhatsApp Support', on: true },
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Standard',
    tagline: 'For growing water businesses',
    originalPrice: 1199,
    offerPrice: 599,
    period: '/month',
    popular: true,
    features: [
      { label: 'Up to 200 Customers', on: true },
      { label: 'Multiple Delivery Routes', on: true },
      { label: 'Monthly Billing', on: true },
      { label: 'Jug Tracking', on: true },
      { label: 'GST Invoice', on: false },
      { label: 'Reports Export', on: true, note: 'Excel / PDF' },
      { label: 'WhatsApp + Call Support', on: true },
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Pro',
    tagline: 'For large-scale operations',
    originalPrice: 1999,
    offerPrice: 999,
    period: '/month',
    popular: false,
    features: [
      { label: 'Unlimited Customers', on: true },
      { label: 'Unlimited Delivery Boys', on: true },
      { label: 'Monthly Billing', on: true },
      { label: 'Jug Tracking', on: true },
      { label: 'GST Invoice', on: true },
      { label: 'Reports Export', on: true, note: 'Advanced' },
      { label: 'Priority Support', on: true },
    ],
    cta: 'Start Free Trial',
  },
];

function PriceCounter({ value, inView }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
      className="text-5xl font-extrabold tracking-tight"
    >
      ₹{value}
    </motion.span>
  );
}

function PlanCard({ plan, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const isPop = plan.popular;
  const savings = Math.round(((plan.originalPrice - plan.offerPrice) / plan.originalPrice) * 100);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
      className={`relative rounded-3xl flex flex-col overflow-hidden ${
        isPop
          ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-2xl shadow-blue-900/40 ring-2 ring-cyan-500/40 lg:scale-105 z-10'
          : 'bg-white border border-slate-200 text-slate-900 shadow-lg shadow-slate-200/50'
      }`}
    >
      {/* Launch offer ribbon */}
      {isPop && (
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={inView ? { x: 0, opacity: 1 } : {}}
          transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
          className="absolute top-5 -right-8 rotate-45 px-10 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-lg z-20"
        >
          Most Popular
        </motion.div>
      )}

      {/* Header */}
      <div className={`px-7 pt-7 pb-5 ${isPop ? 'border-b border-white/10' : 'border-b border-slate-100'}`}>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-bold">{plan.name}</h3>
          {savings > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isPop ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              SAVE {savings}%
            </motion.span>
          )}
        </div>
        <p className={`text-sm ${isPop ? 'text-slate-400' : 'text-slate-500'}`}>{plan.tagline}</p>

        {/* Price block */}
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-1">
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
              className={`text-sm line-through decoration-2 ${isPop ? 'text-slate-500 decoration-red-400/60' : 'text-slate-400 decoration-red-400/60'}`}
            >
              ₹{plan.originalPrice}/month
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5, type: 'spring' }}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/90 text-white"
            >
              LAUNCH OFFER
            </motion.span>
          </div>
          <div className="flex items-baseline gap-1">
            <PriceCounter value={plan.offerPrice} inView={inView} />
            <span className={`text-sm font-medium ${isPop ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
            className={`text-xs mt-1.5 ${isPop ? 'text-cyan-400/80' : 'text-emerald-600'}`}
          >
            Startup concession price — limited time only
          </motion.p>
        </div>
      </div>

      {/* Features */}
      <div className="px-7 py-5 flex-1">
        <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isPop ? 'text-slate-500' : 'text-slate-400'}`}>
          What's included
        </p>
        <ul className="space-y-3">
          {plan.features.map((f, fi) => (
            <motion.li
              key={f.label}
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 + fi * 0.08 }}
              className="flex items-center gap-2.5 text-sm"
            >
              <span className={`material-symbols-outlined text-base ${
                f.on
                  ? (isPop ? 'text-cyan-400 ms-fill' : 'text-emerald-500 ms-fill')
                  : (isPop ? 'text-slate-600' : 'text-slate-300')
              }`}>
                {f.on ? 'check_circle' : 'cancel'}
              </span>
              <span className={
                f.on
                  ? (isPop ? 'text-slate-200' : 'text-slate-700')
                  : (isPop ? 'text-slate-500 line-through' : 'text-slate-400 line-through')
              }>
                {f.label}
              </span>
              {f.note && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto shrink-0 ${
                  isPop ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>{f.note}</span>
              )}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-7 pb-7">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
            isPop
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {plan.cta}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-cyan-50/50 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Simple, Transparent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Pricing</span>
          </h2>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto">
            Start free for 14 days. No credit card required.
          </p>
        </motion.div>

        {/* Launch offer banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
          className="mx-auto max-w-md mb-12"
        >
          <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-[2px] shadow-xl shadow-orange-500/20">
            <div className="bg-white rounded-[14px] px-5 py-3 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <span className="material-symbols-outlined ms-fill text-2xl text-orange-500">local_fire_department</span>
              </motion.div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Startup Launch Offer</p>
                <p className="text-xs text-slate-500">Special concession pricing for early adopters — limited time!</p>
              </div>
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs font-extrabold bg-gradient-to-r from-amber-500 to-red-500 text-transparent bg-clip-text"
              >
                50% OFF
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6 items-start">
          {plans.map((p, i) => <PlanCard key={p.name} plan={p} index={i} />)}
        </div>

        {/* Bottom trust note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="text-center mt-10 space-y-2"
        >
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-500">verified</span>
              14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-500">credit_card_off</span>
              No credit card needed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-500">cancel</span>
              Cancel anytime
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Designed for Offices & Factories in Tier 2 & Tier 3 Cities
          </p>
        </motion.div>
      </div>
    </section>
  );
}
