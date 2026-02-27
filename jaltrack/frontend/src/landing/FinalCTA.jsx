import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/10 mb-6">
            <span className="material-symbols-outlined ms-fill text-cyan-400 text-sm">rocket_launch</span>
            <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">Ready to grow?</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
            Take Control of Your Water Business{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Today.</span>
          </h2>

          <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto">
            Join hundreds of Indian water suppliers who've switched from chaos to clarity with JalTrack.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all">
              Start Free Trial
            </button>
            <Link to="/business/login" className="px-8 py-3.5 rounded-xl text-sm font-bold text-white border border-white/20 bg-white/5 backdrop-blur hover:bg-white/10 transition-all">
              Login to Dashboard →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
