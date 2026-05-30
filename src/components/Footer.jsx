import { Link } from 'react-router-dom';
import { Instagram, Linkedin } from 'lucide-react';

const navLinks = [
  { label: 'Work', href: '#projects' },
  { label: 'Studio', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Journal', href: '#journal' },
  { label: 'Contact', href: '#contact' },
];

export default function Footer() {
  const handleClick = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-nearblack border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6 md:px-16 py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <Link to="/" className="font-cormorant text-3xl font-light text-offwhite tracking-tight">
            M&amp;M
          </Link>

          <div className="flex flex-wrap justify-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleClick(e, link.href)}
                className="font-dmsans text-xs tracking-[0.2em] uppercase text-offwhite/35 hover:text-gold transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <a href="#" aria-label="Instagram" className="text-offwhite/30 hover:text-gold transition-colors duration-300">
              <Instagram size={17} strokeWidth={1.5} />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-offwhite/30 hover:text-gold transition-colors duration-300">
              <Linkedin size={17} strokeWidth={1.5} />
            </a>
            <a href="#" aria-label="Pinterest" className="text-offwhite/30 hover:text-gold transition-colors duration-300">
              <svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" strokeWidth="1.5" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.76 1.27-5.38 1.27-5.38s-.32-.65-.32-1.61c0-1.51.88-2.64 1.97-2.64.93 0 1.38.7 1.38 1.54 0 .94-.6 2.34-.91 3.64-.26 1.09.54 1.97 1.6 1.97 1.93 0 3.22-2.48 3.22-5.41 0-2.23-1.5-3.9-4.22-3.9-3.08 0-5 2.3-5 4.87 0 .89.26 1.51.67 2 .07.09.08.17.05.27-.07.27-.22.87-.25 1-.04.16-.16.22-.3.16-1.12-.46-1.64-1.7-1.64-3.09 0-2.9 2.45-6.41 7.33-6.41 3.91 0 6.48 2.84 6.48 5.89 0 4.04-2.23 7.06-5.51 7.06-1.1 0-2.14-.6-2.5-1.27l-.69 2.63c-.25.95-.92 2.14-1.38 2.86.7.22 1.44.34 2.2.34 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="font-dmsans text-offwhite/20 text-xs tracking-widest">
            &copy; 2025 M&amp;M Design Group. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}