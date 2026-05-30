import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { label: 'Projects Completed', value: 48, suffix: '+' },
  { label: 'Countries', value: 12, suffix: '' },
  { label: 'Years of Excellence', value: 15, suffix: '' },
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
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-32 bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="relative"
          >
            <img
              src={"https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1000&q=80"}
              alt="M&amp;M Design Studio workspace"
              className="w-full h-[600px] object-cover"
            />
            <div className="absolute -bottom-6 -right-6 w-48 h-48 border border-gold/20 pointer-events-none" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <p className="font-dmsans text-gold text-xs tracking-[0.35em] uppercase mb-8">Our Philosophy</p>

            <blockquote
              className="font-cormorant italic text-offwhite/80 leading-snug mb-10"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}
            >
              &#8220;Architecture is the art of how to waste space.&#8221;
              <footer className="font-dmsans text-offwhite/30 text-xs tracking-widest uppercase mt-3 not-italic">
                &mdash; Philip Johnson
              </footer>
            </blockquote>

            <div className="space-y-5 font-dmsans text-offwhite/55 text-sm leading-relaxed mb-12">
              <p>
                M&amp;M Design Group was founded on a single conviction: that great architecture demands the courage
                to subtract. Where others accumulate, we distil. Where others complicate, we clarify. Every project
                begins with weeks of listening before a single line is drawn.
              </p>
              <p>
                Our approach to materiality is rooted in honesty. Concrete is concrete. Steel is steel. We do not
                disguise structure, nor do we impose ornament without reason. The beauty we seek is the beauty of
                things made precisely right &mdash; of light falling on a surface at an angle considered for months.
              </p>
              <p>
                Human-centred design is not a methodology for us &mdash; it is the only reason architecture exists.
                Every space we create is ultimately a stage for human experience: for the quality of a morning,
                the memory of an afternoon, the feeling of arriving home.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/8">
              {stats.map((stat, i) => (
                <div key={stat.label}>
                  <div
                    ref={(el) => (statRefs.current[i] = el)}
                    className="font-cormorant text-offwhite font-light mb-1"
                    style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
                  >
                    0
                  </div>
                  <div className="font-dmsans text-offwhite/35 text-xs tracking-widest uppercase leading-tight">
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