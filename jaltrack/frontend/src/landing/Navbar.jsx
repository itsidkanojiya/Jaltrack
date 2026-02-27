import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setOpen(false);
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-shadow">
            <span className="material-symbols-outlined ms-fill text-lg">water_drop</span>
          </div>
          <span className={`text-lg font-extrabold tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
            Jal<span className="text-cyan-500">Track</span>
          </span>
        </button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ label, href }) => (
            <button
              key={href}
              onClick={() => scrollTo(href)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                scrolled ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
          <Link
            to="/business/login"
            className="ml-3 px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-105"
          >
            Login
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2">
          <span className={`material-symbols-outlined text-2xl ${scrolled ? 'text-slate-900' : 'text-white'}`}>
            {open ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-4 space-y-1"
        >
          {links.map(({ label, href }) => (
            <button key={href} onClick={() => scrollTo(href)} className="block w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
              {label}
            </button>
          ))}
          <Link to="/business/login" className="block w-full text-center mt-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            Login
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}
