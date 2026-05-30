import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { categories } from '../lib/projects';
import { useProjects } from '@/hooks/use-projects';
import ProjectCard from './ProjectCard';

gsap.registerPlugin(ScrollTrigger);

export default function ProjectsSection() {
  const [activeFilter, setActiveFilter] = useState('All');
  const { data: projects = [] } = useProjects();
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardRefs = useRef([]);

  const filtered =
    activeFilter === 'All' ? projects : projects.filter((p) => p.category === activeFilter);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: headingRef.current, start: 'top 85%' },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);
      if (!cards.length) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: cards[0], start: 'top 90%' },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [filtered]);

  return (
    <section id="projects" ref={sectionRef} className="py-28 md:py-36 bg-slate border-t border-linen/8">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div ref={headingRef} className="mb-16 md:mb-20">
          <p className="section-label mb-4">Selected work</p>
          <h2 className="section-title" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.75rem)' }}>
            Projects
          </h2>
          <div className="mt-10 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`font-body text-[0.65rem] tracking-[0.2em] uppercase px-4 py-2 border transition-all duration-300 ${
                  activeFilter === cat
                    ? 'border-bronze text-bronze bg-bronze/10'
                    : 'border-linen/15 text-stone hover:border-linen/35 hover:text-linen'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {filtered.map((project, i) => (
            <ProjectCard
              key={project.slug}
              project={project}
              innerRef={(el) => (cardRefs.current[i] = el)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
