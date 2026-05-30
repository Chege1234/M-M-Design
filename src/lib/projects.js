import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { categories, projects as fallbackProjects } from '@/data/projects-fallback';

export { categories };

export function mapProjectRow(row) {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    location: row.location,
    year: row.year,
    area: row.area,
    status: row.status,
    image: row.image,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    description: row.description,
    challenge: row.challenge,
    outcome: row.outcome,
  };
}

export async function fetchProjects() {
  if (!isSupabaseConfigured) return fallbackProjects;

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    if (error) console.warn('Failed to load projects from Supabase:', error.message);
    return fallbackProjects;
  }

  return data.map(mapProjectRow);
}

export async function fetchProjectBySlug(slug) {
  if (!isSupabaseConfigured) {
    return fallbackProjects.find((p) => p.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn('Failed to load project from Supabase:', error.message);
    return fallbackProjects.find((p) => p.slug === slug) ?? null;
  }

  return mapProjectRow(data);
}

export async function submitContactInquiry({ name, email, type, message }) {
  if (!isSupabaseConfigured) {
    throw new Error('Contact form is not configured yet.');
  }

  const { error } = await supabase.from('contact_inquiries').insert({
    name,
    email,
    project_type: type,
    message,
  });

  if (error) throw error;
}
