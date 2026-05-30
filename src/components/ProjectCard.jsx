import { Link } from 'react-router-dom';

export default function ProjectCard({ project, innerRef }) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      ref={innerRef}
      className="project-card group block"
    >
      <div className="relative overflow-hidden bg-panel" style={{ aspectRatio: '4/3' }}>
        <img
          src={project.image}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 md:p-8">
          <p className="section-label mb-2">
            {project.category} · {project.year}
          </p>
          <h3 className="font-display text-linen text-2xl md:text-3xl leading-tight mb-1">
            {project.name}
          </h3>
          <p className="font-body text-stone text-xs tracking-widest">{project.location}</p>
        </div>
      </div>
      <div className="pt-5 pb-3 border-b border-linen/10 flex items-end justify-between gap-4">
        <h3 className="font-display text-linen text-xl group-hover:text-bronze transition-colors duration-300">
          {project.name}
        </h3>
        <span className="font-body text-stone text-[0.65rem] tracking-widest shrink-0">
          {project.location}, {project.year}
        </span>
      </div>
    </Link>
  );
}
