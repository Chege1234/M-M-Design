import { Link } from 'react-router-dom';
import { Instagram, ArrowUp } from 'lucide-react';

const navLinks = [
  { label: 'Work', href: '#projects' },
  { label: 'Studio', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Contact', href: '#contact' },
];

export default function Footer() {
  const handleClick = (e, href) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate border-t border-linen/10">
      <div className="max-w-7xl mx-auto px-6 md:px-16 py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <Link to="/" className="font-display text-2xl md:text-3xl text-linen tracking-tight">
            M&amp;M
          </Link>

          <div className="flex flex-wrap justify-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleClick(e, link.href)}
                className="font-body text-[0.65rem] tracking-[0.2em] uppercase text-stone hover:text-bronze transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <a
              href="https://instagram.com/modules_by_m"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-stone hover:text-bronze transition-colors"
            >
              <Instagram size={17} strokeWidth={1.25} />
            </a>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Scroll to top"
              className="text-stone hover:text-bronze transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              <ArrowUp size={17} strokeWidth={1.25} />
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-linen/10 text-center">
          <p className="font-body text-stone/60 text-[0.65rem] tracking-widest">
            &copy; {new Date().getFullYear()} M&amp;M Design Group
          </p>
        </div>
      </div>
    </footer>
  );
}
