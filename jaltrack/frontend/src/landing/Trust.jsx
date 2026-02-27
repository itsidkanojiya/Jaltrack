import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const badges = [
  { icon: 'flag', title: 'Built for India', desc: 'Designed for Indian water suppliers, billing rules, and workflows.' },
  { icon: 'lock', title: 'Secure & Cloud-Based', desc: 'Bank-level encryption. Your data is safe and always available.' },
  { icon: 'speed', title: 'Real-Time Tracking', desc: 'Every delivery, payment, and jug tracked as it happens.' },
  { icon: 'devices', title: 'Multi-Device Access', desc: 'Works on desktop, tablet, and phone. Access from anywhere.' },
];

const testimonials = [
  { name: 'Suresh Patel', role: 'Owner, Patel Water Supply', text: 'JalTrack saved us 3 hours daily. No more diary confusion. Billing is automatic now.', location: 'Ahmedabad' },
  { name: 'Aman Sharma', role: 'Owner, Fresh Water Co.', text: 'My delivery boys use the app daily. I can see everything from my phone. Highly recommended.', location: 'Jaipur' },
  { name: 'Rajiv Verma', role: 'Manager, Verma Enterprises', text: 'Finally I know my real profit. JalTrack shows exactly where money goes.', location: 'Delhi' },
];

export default function Trust() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Trust Badges */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-cyan-50 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-4">Why JalTrack</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Trusted by Water Suppliers{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Across India</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {badges.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
                <span className="material-symbols-outlined ms-fill text-white text-xl">{b.icon}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{b.title}</h3>
              <p className="text-sm text-slate-500">{b.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, si) => (
                  <span key={si} className="material-symbols-outlined ms-fill text-amber-400 text-lg">star</span>
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {t.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role} · {t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
