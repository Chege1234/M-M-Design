import { Link } from 'react-router-dom';

export default function ProjectCard({ project, innerRef }) {
  return (
    <Link to={`/projects/${project.slug}`} ref={innerRef} className="project-card group block">
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={project.image}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-7">
          <p className="font-dmsans text-gold text-xs tracking-[0.25em] uppercase mb-2">
            {project.category} · {project.year}
          </p>
          <h3 className="font-cormorant text-offwhite text-3xl font-light leading-tight mb-1">
            {project.name}
          </h3>
          <p className="font-dmsans text-offwhite/60 text-xs tracking-widest">
            {project.location}
          </p>
        </div>
      </div>
      <div className="pt-4 pb-2 border-b border-white/8">
        <div className="flex items-center justify-between">
          <h3 className="font-cormorant text-offwhite text-xl font-light group-hover:text-gold transition-colors duration-300">
            {project.name}
          </h3>
          <span className="font-dmsans text-offwhite/40 text-xs tracking-widest">
            {project.location}, {project.year}
          </span>
        </div>
      </div>
    </Link>
  );
}