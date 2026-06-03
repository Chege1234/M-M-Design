import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Work', href: '#projects' },
  { label: 'Studio', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-5 transition-all duration-500 ${
          scrolled
            ? 'bg-ink/95 backdrop-blur-md border-b border-linen/10'
            : 'bg-transparent'
        }`}
      >
        <Link to="/" className="font-display text-2xl md:text-3xl text-linen tracking-tight">
          M&amp;M
        </Link>

        <div className="hidden md:flex items-center gap-12">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="font-body text-[0.68rem] tracking-[0.24em] uppercase font-medium text-linen/85 hover:text-linen transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          className="md:hidden text-linen"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={1.25} />
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-ink flex flex-col justify-center px-10"
          >
            <button
              type="button"
              className="absolute top-6 right-8 text-linen"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} strokeWidth={1.25} />
            </button>

            <div className="flex flex-col gap-10">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="font-display text-4xl md:text-5xl text-linen hover:text-bronze transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
            </div>

            <p className="absolute bottom-10 left-10 font-body text-[0.65rem] tracking-[0.3em] uppercase text-stone">
              M&amp;M Design Group
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
