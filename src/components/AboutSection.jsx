import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { label: 'Projects completed', value: 48, suffix: '+' },
  { label: 'Countries', value: 12, suffix: '' },
  { label: 'Years of practice', value: 15, suffix: '' },
];

export default function AboutSection() {
  const sectionRef = useRef(null);
  const statRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      stats.forEach((stat, i) => {
        const el = statRefs.current[i];
        if (!el) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: stat.value,
          duration: 2.5,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.round(obj.val) + stat.suffix;
          },
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-28 md:py-36 bg-ink">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&q=80"
              alt="M&amp;M Design studio"
              className="w-full h-[480px] md:h-[560px] object-cover"
            />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 border border-bronze/30 pointer-events-none hidden md:block" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <p className="section-label mb-6">Our philosophy</p>

            <blockquote
              className="font-display italic text-linen/90 leading-snug mb-10"
              style={{ fontSize: 'clamp(1.35rem, 2.5vw, 2rem)' }}
            >
              &ldquo;Architecture is the thoughtful making of space.&rdquo;
              <footer className="font-body text-stone text-[0.65rem] tracking-widest uppercase mt-4 not-italic">
                — Louis Kahn
              </footer>
            </blockquote>

            <div className="space-y-5 font-body text-stone text-sm leading-relaxed mb-12">
              <p>
                M&amp;M Design Group was founded on a single conviction: great architecture demands the courage to
                subtract. Where others accumulate, we distil. Every project begins with listening before a line is drawn.
              </p>
              <p>
                Our approach to materiality is rooted in honesty — structure, light, and proportion carry the design.
                We seek spaces that feel inevitable: precise in detail and generous in experience.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-linen/10">
              {stats.map((stat, i) => (
                <div key={stat.label}>
                  <div
                    ref={(el) => (statRefs.current[i] = el)}
                    className="font-display text-linen mb-1"
                    style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}
                  >
                    0
                  </div>
                  <div className="font-body text-stone text-[0.6rem] tracking-widest uppercase leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
