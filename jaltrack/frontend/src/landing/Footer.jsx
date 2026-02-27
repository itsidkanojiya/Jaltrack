import { Link } from 'react-router-dom';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'How It Works', href: '#how-it-works' },
    ],
  },
  {
    title: 'Portals',
    links: [
      { label: 'Business Dashboard', to: '/business/login' },
      { label: 'Delivery Panel', to: '/delivery/login' },
      { label: 'Client Portal', to: '/client/login' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About JalTrack', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
];

export default function Footer() {
  const scrollTo = (id) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <footer id="contact" className="bg-slate-900 text-slate-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <span className="material-symbols-outlined ms-fill text-lg">water_drop</span>
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                Jal<span className="text-cyan-400">Track</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              India's smartest Water Jug Management system. Built for suppliers who want to stop guessing and start growing.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-base">mail</span>
                support@jaltrack.in
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-base">call</span>
                +91 98765 43210
              </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className="text-sm hover:text-cyan-400 transition-colors">{link.label}</Link>
                    ) : (
                      <button onClick={() => link.href?.startsWith('#') && scrollTo(link.href)} className="text-sm hover:text-cyan-400 transition-colors">
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 JalTrack. All rights reserved.</p>
          <p>Made with <span className="text-cyan-400">♥</span> in India</p>
        </div>
      </div>
    </footer>
  );
}
