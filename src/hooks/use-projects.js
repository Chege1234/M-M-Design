import { useQuery } from '@tanstack/react-query';
import { fetchProjects, fetchProjectBySlug, fetchCategories } from '@/lib/projects';
import { projects as fallbackProjects, categories as fallbackCategories } from '@/data/projects-fallback';

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

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    placeholderData: fallbackCategories,
    staleTime: 1000 * 60 * 5,
  });
}
