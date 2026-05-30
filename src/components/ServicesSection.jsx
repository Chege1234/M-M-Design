import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    name: 'Architectural Design',
    description: 'From concept to construction documentation, we deliver complete architectural services for residential, cultural, and institutional projects of any scale.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" className="w-10 h-10">
        <rect x="6" y="32" width="36" height="10" />
        <polyline points="6,32 24,8 42,32" />
        <line x1="24" y1="8" x2="24" y2="42" />
        <line x1="14" y1="24" x2="34" y2="24" />
      </svg>
    ),
  },
  {
    name: 'Interior Architecture',
    description: 'We design interior environments with the same precision and intentionality as our buildings — treating every room as a complete spatial composition.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" className="w-10 h-10">
        <rect x="4" y="4" width="40" height="40" />
        <rect x="14" y="14" width="20" height="20" />
        <line x1="4" y1="4" x2="14" y2="14" />
        <line x1="44" y1="4" x2="34" y2="14" />
        <line x1="4" y1="44" x2="14" y2="34" />
        <line x1="44" y1="44" x2="34" y2="34" />
      </svg>
    ),
  },
  {
    name: 'Urban Planning',
    description: 'We engage with the city at every scale — from master planning entire precincts to designing the small spaces between buildings where urban life truly happens.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" className="w-10 h-10">
        <rect x="4" y="28" width="12" height="16" />
        <rect x="18" y="18" width="12" height="26" />
        <rect x="32" y="22" width="12" height="22" />
        <line x1="4" y1="44" x2="44" y2="44" />
        <line x1="10" y1="44" x2="10" y2="28" />
        <line x1="10" y1="20" x2="10" y2="4" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    name: 'Concept & Feasibility',
    description: 'Before committing to a direction, we challenge every assumption. Our feasibility studies give clients the clarity and confidence to invest in exceptional architecture.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" className="w-10 h-10">
        <circle cx="24" cy="20" r="10" />
        <line x1="24" y1="30" x2="24" y2="38" />
        <line x1="18" y1="38" x2="30" y2="38" />
        <line x1="24" y1="4" x2="24" y2="8" />
        <line x1="38" y1="20" x2="42" y2="20" />
        <line x1="6" y1="20" x2="10" y2="20" />
        <line x1="35" y1="9" x2="32" y2="12" />
        <line x1="16" y1="28" x2="13" y2="31" />
      </svg>
    ),
  },
];

export default function ServicesSection() {
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);
      gsap.fromTo(cards,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, stagger: 0.15, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: cards[0], start: 'top 85%' },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="services" ref={sectionRef} className="py-32 px-6 md:px-16 bg-mauve">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <p className="font-dmsans text-gold text-xs tracking-[0.35em] uppercase mb-5">Expertise</p>
          <h2 className="font-cormorant text-offwhite font-light" style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}>
            What We Do
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/8">
          {services.map((service, i) => (
            <div
              key={service.name}
              ref={(el) => (cardRefs.current[i] = el)}
              className="group bg-sand/40 p-12 hover:bg-cream/5 transition-all duration-400 border-l-2 border-transparent hover:border-gold opacity-0"
            >
              <div className="text-offwhite/30 group-hover:text-gold transition-colors duration-400 mb-8">
                {service.icon}
              </div>
              <h3 className="font-cormorant text-offwhite text-3xl font-light mb-5 group-hover:text-gold transition-colors duration-400">
                {service.name}
              </h3>
              <p className="font-dmsans text-offwhite/45 text-sm leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}