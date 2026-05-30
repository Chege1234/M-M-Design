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
  const lineRef = useRef(null);
  const cardRefs = useRef([]);

  const filtered = activeFilter === 'All'
    ? projects
    : projects.filter(p => p.category === activeFilter);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Line draw
      gsap.fromTo(lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1, duration: 1.6, ease: 'power3.inOut',
          scrollTrigger: { trigger: headingRef.current, start: 'top 80%' },
        }
      );

      // Heading reveal
      gsap.fromTo(headingRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: headingRef.current, start: 'top 82%' },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);
      if (!cards.length) return;
      gsap.fromTo(cards,
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, stagger: 0.12, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: cards[0], start: 'top 88%' },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [filtered]);

  return (
    <section id="projects" ref={sectionRef} className="py-32 px-6 md:px-16 bg-nearblack">
      <div className="max-w-7xl mx-auto">
        <div ref={headingRef} className="mb-16 opacity-0">
          <p className="font-dmsans text-gold text-xs tracking-[0.35em] uppercase mb-5">Selected Work</p>
          <h2 className="font-cormorant text-offwhite font-light mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}>
            Our Projects
          </h2>
          <div
            ref={lineRef}
            className="h-px bg-gold origin-left mb-10"
            style={{ transform: 'scaleX(0)' }}
          />
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`font-dmsans text-xs tracking-[0.2em] uppercase px-5 py-2 border transition-all duration-300 ${
                  activeFilter === cat
                    ? 'border-gold text-gold'
                    : 'border-white/15 text-offwhite/40 hover:border-white/40 hover:text-offwhite/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
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