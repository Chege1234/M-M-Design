import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { categories, projects as fallbackProjects } from '@/data/projects-fallback';
import { deleteProjectImages } from './imageUpload';

export { categories };

export async function fetchCategories() {
  if (!isSupabaseConfigured) return categories;

  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('created_at', { ascending: true });

  if (error || !data?.length) {
    if (error) console.warn('Failed to load categories from Supabase:', error.message);
    return categories;
  }

  return data.map(c => c.name);
}

export async function createCategory(name) {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name }])
    .select()
    .single();
  // ignore error if it already exists (handled by on conflict or simply catching it)
  if (error && error.code !== '23505') throw error; 
  return data;
}

export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function mapProjectRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    location: row.location,
    year: row.year,
    area: row.area ?? '',
    status: row.status ?? '',
    image: row.image,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    description: row.description,
    challenge: row.challenge,
    outcome: row.outcome,
    sort_order: row.sort_order ?? 0,
  };
}

function rowFromProject(project, sortOrder) {
  return {
    slug: project.slug,
    name: project.name,
    category: project.category,
    location: project.location,
    year: project.year,
    area: project.area || null,
    status: project.status || null,
    image: project.image,
    gallery: project.gallery ?? [],
    description: project.description,
    challenge: project.challenge,
    outcome: project.outcome,
    sort_order: sortOrder ?? project.sort_order ?? 0,
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

export async function createProject(project, sortOrder = 0) {
  const { data, error } = await supabase
    .from('projects')
    .insert(rowFromProject(project, sortOrder))
    .select()
    .single();
  if (error) throw error;
  return mapProjectRow(data);
}

export async function updateProject(slug, project) {
  const { data, error } = await supabase
    .from('projects')
    .update(rowFromProject(project, project.sort_order))
    .eq('slug', slug)
    .select()
    .single();
  if (error) throw error;
  return mapProjectRow(data);
}

export async function deleteProject(slug) {
  try {
    const project = await fetchProjectBySlug(slug);
    if (project) {
      const allImageUrls = [project.image, ...(project.gallery || [])].filter(Boolean);
      if (allImageUrls.length > 0) {
        await deleteProjectImages(allImageUrls);
      }
    }
  } catch (err) {
    console.warn('Failed to clean up project images during deletion:', err);
  }

  const { error } = await supabase.from('projects').delete().eq('slug', slug);
  if (error) throw error;
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

// ── Contact Reports (contact_inquiries) ──────────────────────────────────────

export async function fetchContactReports() {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('contact_inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateReportStatus(id, status) {
  const { error } = await supabase
    .from('contact_inquiries')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function updateReportPinned(id, pinned) {
  const { error } = await supabase
    .from('contact_inquiries')
    .update({ pinned })
    .eq('id', id);

  if (error) throw error;
}

// ── Leads status ─────────────────────────────────────────────────────────────

export async function fetchLeads() {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateLeadStatus(id, status) {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function updateLeadPinned(id, pinned) {
  const { error } = await supabase
    .from('leads')
    .update({ pinned })
    .eq('id', id);

  if (error) throw error;
}

// ── Admin Notes ──────────────────────────────────────────────────────────────

export async function fetchAdminNotes() {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('admin_notes')
    .select('*')
    .order('note_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAdminNote({ title, content, note_date }) {
  const { data, error } = await supabase
    .from('admin_notes')
    .insert({ title, content, note_date: note_date || new Date().toISOString().split('T')[0] })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAdminNote(id, { title, content }) {
  const { error } = await supabase
    .from('admin_notes')
    .update({ title, content })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteAdminNote(id) {
  const { error } = await supabase
    .from('admin_notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
