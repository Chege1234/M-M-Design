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
      gsap.fromTo(heroRef.current,
        { opacity: 0, scale: 1.04 },
        { opacity: 1, scale: 1, duration: 1.4, ease: 'power3.out' }
      );
      if (contentRef.current?.children) {
        gsap.fromTo(contentRef.current.children,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, stagger: 0.12, delay: 0.4, duration: 1, ease: 'power3.out' }
        );
      }
    });
    return () => ctx.revert();
  }, [project]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nearblack flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-nearblack flex items-center justify-center">
        <div className="text-center">
          <p className="font-cormorant text-offwhite text-4xl font-light mb-6">Project Not Found</p>
          <Link to="/" className="font-dmsans text-gold text-xs tracking-widest uppercase underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-nearblack text-offwhite">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-nearblack/90 backdrop-blur-md border-b border-white/5">
        <Link to="/" className="font-cormorant text-3xl font-light text-offwhite tracking-tight">
          M&amp;M
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 font-dmsans text-xs tracking-[0.2em] uppercase text-offwhite/50 hover:text-gold transition-colors duration-300"
        >
          <ArrowLeft size={14} />
          All Projects
        </Link>
      </div>

      {/* Hero image */}
      <div ref={heroRef} className="relative w-full" style={{ height: '75vh' }}>
        <img
          src={project.image}
          alt={project.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nearblack via-transparent to-black/30" />
        <div className="absolute bottom-0 left-0 right-0 px-8 md:px-16 pb-14">
          <div className="max-w-7xl mx-auto">
            <p className="font-dmsans text-gold text-xs tracking-[0.35em] uppercase mb-4">
              {project.category}
            </p>
            <h1
              className="font-cormorant text-offwhite font-light leading-none"
              style={{ fontSize: 'clamp(3rem, 7vw, 7rem)' }}
            >
              {project.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Meta bar */}
      <div className="border-y border-white/8 px-8 md:px-16 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Location', value: project.location },
            { label: 'Year', value: project.year },
            { label: 'Area', value: project.area },
            { label: 'Status', value: project.status },
          ].map(item => (
            <div key={item.label}>
              <p className="font-dmsans text-offwhite/30 text-xs tracking-widest uppercase mb-1">{item.label}</p>
              <p className="font-dmsans text-offwhite text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="max-w-7xl mx-auto px-8 md:px-16 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-16">
            <div>
              <p className="font-dmsans text-gold text-xs tracking-[0.3em] uppercase mb-5">Overview</p>
              <p className="font-dmsans text-offwhite/65 text-base leading-loose">{project.description}</p>
            </div>
            <div>
              <p className="font-dmsans text-gold text-xs tracking-[0.3em] uppercase mb-5">The Challenge</p>
              <p className="font-dmsans text-offwhite/65 text-base leading-loose">{project.challenge}</p>
            </div>
            <div>
              <p className="font-dmsans text-gold text-xs tracking-[0.3em] uppercase mb-5">The Outcome</p>
              <p className="font-dmsans text-offwhite/65 text-base leading-loose">{project.outcome}</p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <blockquote
              className="font-cormorant italic text-offwhite/60 leading-snug border-l-2 border-gold pl-6 py-2"
              style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)' }}
            >
              &#8220;Precision in every detail, restraint in every decision.&#8221;
            </blockquote>
          </div>
        </div>

        {/* Gallery */}
        <div className="mt-20">
          <p className="font-dmsans text-gold text-xs tracking-[0.3em] uppercase mb-10">Gallery</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {project.gallery.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.9, ease: 'easeOut' }}
                className="overflow-hidden"
                style={{ aspectRatio: '4/3' }}
              >
                <img
                  src={img}
                  alt={`${project.name} view ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-700"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <div className="mt-24 pt-12 border-t border-white/8 flex justify-between items-center">
          <Link
            to="/"
            className="font-dmsans text-xs tracking-[0.25em] uppercase text-offwhite/40 hover:text-gold transition-colors duration-300 flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            All Projects
          </Link>
          <Link to="/" className="font-cormorant text-offwhite text-2xl font-light hover:text-gold transition-colors duration-300">
            M&amp;M
          </Link>
        </div>
      </div>
    </main>
  );
}