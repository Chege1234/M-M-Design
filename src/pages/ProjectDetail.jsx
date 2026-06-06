import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProject } from '@/hooks/use-projects';

export default function ProjectDetail() {
  const { slug } = useParams();
  const { data: project, isLoading } = useProject(slug);
  const heroRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, scale: 1.03 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' }
      );
      if (contentRef.current?.children) {
        gsap.fromTo(
          contentRef.current.children,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, stagger: 0.1, delay: 0.3, duration: 0.9, ease: 'power3.out' }
        );
      }
    });
    return () => ctx.revert();
  }, [project]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-linen/20 border-t-bronze rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-linen text-3xl mb-6">Project not found</p>
          <Link to="/" className="font-body text-bronze text-[0.65rem] tracking-widest uppercase">
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-ink text-linen">
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-5 bg-ink/90 backdrop-blur-md border-b border-linen/10">
        <Link to="/" className="font-display text-2xl md:text-3xl text-linen">
          M&amp;M
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 font-body text-[0.65rem] tracking-[0.2em] uppercase text-stone hover:text-bronze transition-colors"
        >
          <ArrowLeft size={14} />
          All projects
        </Link>
      </div>

      <div ref={heroRef} className="relative w-full" style={{ height: '72vh' }}>
        <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-12 md:pb-16">
          <div className="max-w-7xl mx-auto">
            <p className="section-label mb-4">{project.category}</p>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
              {project.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="border-y border-linen/10 px-6 md:px-16 py-8 bg-slate">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Location', value: project.location },
            { label: 'Year', value: project.year },
            { label: 'Area', value: project.area },
            { label: 'Status', value: project.status },
          ].map((item) => (
            <div key={item.label}>
              <p className="font-body text-stone text-[0.65rem] tracking-widest uppercase mb-1">{item.label}</p>
              <p className="font-body text-linen text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div ref={contentRef} className="max-w-7xl mx-auto px-6 md:px-16 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-14">
            {[
              { title: 'Overview', text: project.description },
              { title: 'The challenge', text: project.challenge },
              { title: 'The outcome', text: project.outcome },
            ].map((block) => (
              <div key={block.title}>
                <p className="section-label mb-4">{block.title}</p>
                <p className="font-body text-stone text-base leading-relaxed">{block.text}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-5">
            <blockquote
              className="font-display italic text-linen/70 leading-snug border-l-2 border-bronze pl-6 py-2"
              style={{ fontSize: 'clamp(1.25rem, 2vw, 1.75rem)' }}
            >
              &ldquo;Precision in every detail.&rdquo;
            </blockquote>
          </div>
        </div>

        <div className="mt-20">
          <p className="section-label mb-8">Gallery</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {project.gallery.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7 }}
                className="overflow-hidden bg-panel"
                style={{ aspectRatio: '4/3' }}
              >
                <img
                  src={img}
                  alt={`${project.name} ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-linen/10 flex justify-between items-center">
          <Link
            to="/"
            className="font-body text-[0.65rem] tracking-[0.2em] uppercase text-stone hover:text-bronze flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            All projects
          </Link>
          <Link to="/" className="font-display text-xl text-linen hover:text-bronze transition-colors">
            M&amp;M
          </Link>
        </div>
      </div>
    </main>
  );
}
