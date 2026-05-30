import { useEffect, useRef } from 'react';
import HeroCanvas from './HeroCanvas';
import gsap from 'gsap';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WORDS = ['We', 'Build', 'What', 'Others', 'Only', 'Imagine'];

export default function HeroSection() {
  const contentRef = useRef(null);
  const headlineRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const children = contentRef.current?.children;
      if (children) {
        gsap.set(children, { opacity: 0, y: 35 });
        gsap.to(children, {
          opacity: 1, y: 0,
          stagger: 0.14,
          delay: 0.3,
          duration: 1.3,
          ease: 'power3.out',
        });
      }

      const wordEls = headlineRef.current?.querySelectorAll('[data-word]');
      if (wordEls) {
        wordEls.forEach((el, wi) => {
          const final = el.getAttribute('data-word');
          let frame = 0;
          const totalFrames = 20;
          setTimeout(() => {
            const iv = setInterval(() => {
              frame++;
              const revealed = Math.floor((frame / totalFrames) * final.length);
              el.textContent = final.split('').map((ch, i) =>
                i < revealed ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
              ).join('');
              if (frame >= totalFrames) {
                el.textContent = final;
                clearInterval(iv);
              }
            }, 55);
          }, wi * 360);
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const handleNavClick = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-nearblack">
      <HeroCanvas />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

      <div ref={contentRef} className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <p className="font-dmsans text-gold text-xs tracking-[0.45em] uppercase mb-8">
          Est. 2010 · Johannesburg
        </p>

        <h1
          ref={headlineRef}
          className="font-cormorant font-light text-offwhite leading-none mb-6"
          style={{ fontSize: 'clamp(3rem, 8vw, 8rem)' }}
        >
          {WORDS.map((word, i) => (
            <span
              key={i}
              data-word={word}
              className="inline-block mr-[0.25em] last:mr-0"
            >
              {word}
            </span>
          ))}
        </h1>

        <p className="font-dmsans text-offwhite/50 text-xs md:text-sm tracking-[0.3em] uppercase mb-12">
          M&amp;M Design Group — Architecture &amp; Urban Design
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          <button
            onClick={() => handleNavClick('#projects')}
            className="border border-offwhite/30 text-offwhite px-10 py-3.5 text-xs tracking-[0.25em] uppercase font-dmsans hover:border-gold hover:text-gold transition-all duration-400"
          >
            View Our Work
          </button>
          <button
            onClick={() => handleNavClick('#contact')}
            className="text-offwhite/50 text-xs tracking-[0.25em] uppercase font-dmsans hover:text-gold transition-colors duration-300 underline underline-offset-4 decoration-offwhite/20"
          >
            Get In Touch
          </button>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="font-dmsans text-offwhite/30 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-14 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-b from-gold to-transparent animate-bounce" />
        </div>
      </div>
    </section>
  );
}