import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&q=80';

export default function HeroSection() {
  const contentRef = useRef(null);

  useEffect(() => {
    const els = contentRef.current?.querySelectorAll('[data-animate]');
    els?.forEach((el, i) => {
      el.style.animationDelay = `${0.15 + i * 0.12}s`;
    });
  }, []);

  const handleNavClick = (href) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-ink">
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover opacity-50 grayscale-[20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(212,165,116,0.08),transparent_55%)]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-16 pb-24 md:pb-32 pt-32">
        <div ref={contentRef} className="max-w-4xl">
          <p
            data-animate
            className="section-label mb-6 opacity-0 animate-fade-up"
          >
            Est. 2022 · Cyprus
          </p>

          <h1
            data-animate
            className="section-title opacity-0 animate-fade-up mb-6"
            style={{ fontSize: 'clamp(2.75rem, 7vw, 5.5rem)' }}
          >
            M&amp;M Design Group
          </h1>

          <p
            data-animate
            className="font-body text-stone text-sm md:text-base tracking-wide max-w-xl mb-10 opacity-0 animate-fade-up"
          >
            Architecture and urban design shaped with restraint — spaces that feel inevitable, not imposed.
          </p>

          <div
            data-animate
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 opacity-0 animate-fade-up"
          >
            <button
              type="button"
              onClick={() => handleNavClick('#projects')}
              className="bg-bronze text-ink px-8 py-3.5 text-[0.65rem] tracking-[0.28em] uppercase font-body font-medium hover:bg-bronze/90 transition-colors"
            >
              View our work
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('#contact')}
              className="border border-linen/25 text-linen px-8 py-3.5 text-[0.65rem] tracking-[0.28em] uppercase font-body hover:border-bronze hover:text-bronze transition-colors"
            >
              Get in touch
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="hidden md:flex absolute bottom-12 right-16 flex-col items-center gap-3"
        >
          <span className="font-body text-stone/60 text-[0.6rem] tracking-[0.35em] uppercase [writing-mode:vertical-rl] rotate-180">
            Scroll
          </span>
          <div className="w-px h-16 bg-gradient-to-b from-bronze/80 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
