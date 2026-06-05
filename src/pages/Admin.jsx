import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  slugify,
  categories,
} from '@/lib/projects';
import { deleteProjectImages } from '@/lib/imageUpload';
import ImageDropZone from '@/components/ImageDropZone';
import { Loader2, Plus, Pencil, Trash2, LogOut, ExternalLink } from 'lucide-react';

const emptyProject = () => ({
  slug: '',
  name: '',
  category: categories[1] ?? 'Contemporary Houses',
  location: '',
  year: new Date().getFullYear().toString(),
  area: '',
  status: 'Completed',
  image: '',
  galleryUrls: [],
  description: '',
  challenge: '',
  outcome: '',
});

function projectToForm(p) {
  return {
    ...p,
    galleryUrls: Array.isArray(p.gallery) ? [...p.gallery] : [],
  };
}

function formToProject(form) {
  return {
    slug: form.slug || slugify(form.name),
    name: form.name,
    category: form.category,
    location: form.location,
    year: form.year,
    area: form.area,
    status: form.status,
    image: form.image,
    gallery: (form.galleryUrls ?? []).filter(Boolean),
    description: form.description,
    challenge: form.challenge,
    outcome: form.outcome,
    sort_order: form.sort_order ?? 0,
  };
}

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-panel/40 backdrop-blur-sm border border-linen/20 p-8">
        <h1 className="font-display text-3xl text-linen font-light mb-2">Studio Admin</h1>
        <p className="font-body text-linen/60 text-sm mb-8">Sign in to manage projects</p>
        {error && <p className="text-red-200 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-ink border border-linen/15 px-4 py-3 text-linen text-sm focus:outline-none focus:border-bronze"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink border border-linen/15 px-4 py-3 text-linen text-sm focus:outline-none focus:border-bronze"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-bronze text-ink py-3 text-xs tracking-widest uppercase font-body hover:bg-bronze/90 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <Link to="/" className="block text-center mt-6 text-linen/50 text-xs hover:text-linen">
          ← Back to site
        </Link>
      </div>
    </div>
  );
}

function ProjectForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial ?? emptyProject());

  useEffect(() => {
    setForm(initial ?? emptyProject());
  }, [initial]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formToProject(form));
  };

  const fieldClass =
    'w-full bg-ink border border-linen/15 px-3 py-2 text-linen text-sm focus:outline-none focus:border-bronze';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-panel/30 border border-linen/15 p-6">
      <h3 className="font-display text-2xl text-linen font-light">
        {initial?.slug ? 'Edit project' : 'New project'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-linen/50 text-xs uppercase tracking-widest">Name</label>
          <input className={fieldClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="text-linen/50 text-xs uppercase tracking-widest">Slug</label>
          <input
            className={fieldClass}
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder={slugify(form.name)}
            disabled={Boolean(initial?.slug)}
          />
        </div>
        <div>
          <label className="text-linen/50 text-xs uppercase tracking-widest">Category</label>
          <select
            className={fieldClass}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {categories.filter((c) => c !== 'All').map((c) => (
              <option key={c} value={c} className="bg-ink">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-linen/50 text-xs uppercase tracking-widest">Location</label>
          <input className={fieldClass} value={form.location} onChange={(e) => set('location', e.target.value)} required />
        </div>
        <div>
          <label className="text-linen/50 text-xs uppercase tracking-widest">Year</label>
          <input className={fieldClass} value={form.year} onChange={(e) => set('year', e.target.value)} required />
        </div>
        <div>
          <label className="text-linen/50 text-xs uppercase tracking-widest">Area</label>
          <input className={fieldClass} value={form.area} onChange={(e) => set('area', e.target.value)} />
        </div>
        <div>
          <label className="text-linen/50 text-xs uppercase tracking-widest">Status</label>
          <input className={fieldClass} value={form.status} onChange={(e) => set('status', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="text-linen/50 text-xs uppercase tracking-widest mb-2 block">Cover image</label>
          <ImageDropZone
            value={form.image ? [form.image] : []}
            onChange={(urls) => set('image', urls[0] || '')}
            projectSlug={form.slug || slugify(form.name) || 'new-project'}
            multiple={false}
            label="Drop cover image here or click to browse"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-linen/50 text-xs uppercase tracking-widest mb-2 block">Gallery images</label>
          <ImageDropZone
            value={form.galleryUrls}
            onChange={(urls) => set('galleryUrls', urls)}
            projectSlug={form.slug || slugify(form.name) || 'new-project'}
            multiple={true}
            label="Drop gallery images here or click to browse"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-linen/50 text-xs uppercase tracking-widest">Description</label>
          <textarea className={`${fieldClass} min-h-[100px]`} value={form.description} onChange={(e) => set('description', e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label className="text-linen/50 text-xs uppercase tracking-widest">Challenge</label>
          <textarea className={`${fieldClass} min-h-[80px]`} value={form.challenge} onChange={(e) => set('challenge', e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label className="text-linen/50 text-xs uppercase tracking-widest">Outcome</label>
          <textarea className={`${fieldClass} min-h-[80px]`} value={form.outcome} onChange={(e) => set('outcome', e.target.value)} required />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-bronze text-ink px-6 py-2 text-xs tracking-widest uppercase font-body hover:bg-bronze/90 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save project'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-linen/30 text-linen px-6 py-2 text-xs tracking-widest uppercase font-body hover:border-linen"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AdminDashboard() {
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'leads'
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['projects'] });

  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const handleSave = async (project, originalSlug) => {
    setSaving(true);
    setError('');
    try {
      if (originalSlug) {
        await updateProject(originalSlug, project);
      } else {
        await createProject(project, projects.length + 1);
      }
      setEditing(null);
      setCreating(false);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm(`Delete project "${slug}"?`)) return;
    setError('');
    try {
      // Clean up storage images before deleting the project row
      const project = projects.find((p) => p.slug === slug);
      if (project) {
        const allImageUrls = [project.image, ...(project.gallery || [])].filter(Boolean);
        await deleteProjectImages(allImageUrls).catch((e) => console.warn('Image cleanup:', e));
      }
      await deleteProject(slug);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const { error: err } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id);
      if (err) throw err;
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {
      console.error('Failed to update lead status:', err);
      alert(err.message || 'Failed to update lead status');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const newLeadsCount = leads.filter((l) => l.status === 'New').length;

  return (
    <div className="min-h-screen bg-ink text-linen">
      <header className="border-b border-linen/10 bg-slate/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-light">Project Admin</h1>
            <p className="font-body text-linen/50 text-xs mt-1">{user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1 text-linen/60 text-xs tracking-widest uppercase hover:text-linen"
            >
              <ExternalLink size={14} /> View site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-linen/60 text-xs tracking-widest uppercase hover:text-linen"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {error && <p className="text-red-200 text-sm bg-red-900/20 p-3 border border-red-300/20">{error}</p>}

        {/* Tab System */}
        <div className="flex border-b border-linen/10 gap-8 mb-6">
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-4 text-xs font-body tracking-widest uppercase transition-colors relative cursor-pointer ${
              activeTab === 'projects' ? 'text-bronze font-semibold' : 'text-linen/50 hover:text-linen'
            }`}
          >
            Projects
            {activeTab === 'projects' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-bronze" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-4 text-xs font-body tracking-widest uppercase transition-colors relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'leads' ? 'text-bronze font-semibold' : 'text-linen/50 hover:text-linen'
            }`}
          >
            Leads
            {newLeadsCount > 0 && (
              <span className="bg-bronze text-ink font-body text-[0.65rem] font-bold px-1.5 py-0.5 leading-none select-none">
                {newLeadsCount}
              </span>
            )}
            {activeTab === 'leads' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-bronze" />
            )}
          </button>
        </div>

        {activeTab === 'projects' ? (
          <>
            {!creating && !editing && (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 bg-bronze text-ink px-5 py-2.5 text-xs tracking-widest uppercase font-body hover:bg-bronze/90"
              >
                <Plus size={16} /> Add project
              </button>
            )}

            {creating && (
              <ProjectForm
                onSave={(p) => handleSave(p, null)}
                onCancel={() => setCreating(false)}
                saving={saving}
              />
            )}

            {editing && (
              <ProjectForm
                initial={projectToForm(editing)}
                onSave={(p) => handleSave(p, editing.slug)}
                onCancel={() => setEditing(null)}
                saving={saving}
              />
            )}

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-linen/50" size={32} />
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <div
                    key={p.slug}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-panel/25 border border-linen/15 p-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {p.image && (
                        <img src={p.image} alt="" className="w-16 h-12 object-cover shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-display text-xl text-linen truncate">{p.name}</p>
                        <p className="font-body text-linen/50 text-xs">
                          {p.category} · {p.location} · {p.year}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setCreating(false);
                          setEditing(p);
                        }}
                        className="flex items-center gap-1 border border-linen/25 px-3 py-1.5 text-xs uppercase tracking-wider hover:border-bronze"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.slug)}
                        className="flex items-center gap-1 border border-red-300/30 text-red-100 px-3 py-1.5 text-xs uppercase tracking-wider hover:border-red-200"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Leads Tab Content */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-2xl font-light text-linen">Inbound Leads</h2>
              <button
                onClick={fetchLeads}
                className="border border-linen/25 px-4 py-2 text-xs uppercase tracking-wider hover:border-bronze font-body text-linen/80"
              >
                Refresh
              </button>
            </div>

            {leadsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-linen/50" size={32} />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-16 border border-linen/10 bg-panel/10">
                <p className="font-body text-sm text-linen/50">No leads captured yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-panel/25 border border-linen/15 p-6 space-y-4 rounded-none"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-2xl font-light text-linen leading-tight">
                          {lead.client_name}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 font-body text-linen/60 text-xs">
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="hover:text-bronze transition-colors">
                              {lead.email}
                            </a>
                          )}
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="hover:text-bronze transition-colors">
                              {lead.phone}
                            </a>
                          )}
                          <span className="text-stone/50">·</span>
                          <span>
                            {new Date(lead.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-body text-[0.65rem] text-stone tracking-widest uppercase shrink-0">
                          Status:
                        </span>
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                          className="bg-ink border border-linen/25 px-3 py-1.5 text-xs uppercase tracking-wider font-body text-linen focus:outline-none focus:border-bronze cursor-pointer rounded-none"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Declined">Declined</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-t border-b border-linen/10">
                      <div>
                        <span className="block text-[0.65rem] uppercase tracking-wider text-stone mb-1 font-body font-semibold">
                          Type
                        </span>
                        <span className="text-xs text-linen/80">{lead.project_type || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[0.65rem] uppercase tracking-wider text-stone mb-1 font-body font-semibold">
                          Location
                        </span>
                        <span className="text-xs text-linen/80">{lead.location || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[0.65rem] uppercase tracking-wider text-stone mb-1 font-body font-semibold">
                          Scale
                        </span>
                        <span className="text-xs text-linen/80">{lead.scale || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[0.65rem] uppercase tracking-wider text-stone mb-1 font-body font-semibold">
                          Timeline
                        </span>
                        <span className="text-xs text-linen/80">{lead.timeline || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[0.65rem] uppercase tracking-wider text-stone mb-1 font-body font-semibold">
                          Budget Range
                        </span>
                        <span className="text-xs text-linen/80">{lead.budget_range || '—'}</span>
                      </div>
                    </div>

                    {lead.notes && (
                      <div className="space-y-1">
                        <span className="block text-[0.65rem] uppercase tracking-wider text-stone font-body font-semibold">
                          Notes
                        </span>
                        <p className="text-xs text-linen/70 leading-relaxed font-body whitespace-pre-wrap">
                          {lead.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Admin() {
  const { user, isLoadingAuth } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6 text-linen text-center">
        <div>
          <p className="font-display text-2xl mb-4">Supabase not configured</p>
          <p className="font-body text-sm text-linen/60 mb-6">
            Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable the admin panel.
          </p>
          <Link to="/" className="text-bronze text-xs uppercase tracking-widest">← Back to site</Link>
        </div>
      </div>
    );
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="animate-spin text-linen/50" size={32} />
      </div>
    );
  }

  if (!user) return <AdminLogin />;

  return <AdminDashboard />;
}
