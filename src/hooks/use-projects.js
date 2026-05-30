import { useQuery } from '@tanstack/react-query';
import { fetchProjects, fetchProjectBySlug } from '@/lib/projects';
import { projects as fallbackProjects } from '@/data/projects-fallback';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    placeholderData: fallbackProjects,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProject(slug) {
  return useQuery({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });
}
