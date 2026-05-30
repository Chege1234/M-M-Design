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
  galleryText: '',
  description: '',
  challenge: '',
  outcome: '',
});

function projectToForm(p) {
  return {
    ...p,
    galleryText: (p.gallery ?? []).join('\n'),
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
    gallery: form.galleryText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
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
    <div className="min-h-screen bg-sand flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-mauve/40 backdrop-blur-sm border border-cream/20 p-8">
        <h1 className="font-cormorant text-3xl text-cream font-light mb-2">Studio Admin</h1>
        <p className="font-dmsans text-cream/60 text-sm mb-8">Sign in to manage projects</p>
        {error && <p className="text-red-200 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-sand/50 border border-cream/20 px-4 py-3 text-cream text-sm focus:outline-none focus:border-gold"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-sand/50 border border-cream/20 px-4 py-3 text-cream text-sm focus:outline-none focus:border-gold"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-cream py-3 text-xs tracking-widest uppercase font-dmsans hover:bg-gold/90 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <Link to="/" className="block text-center mt-6 text-cream/50 text-xs hover:text-cream">
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
    'w-full bg-sand/40 border border-cream/20 px-3 py-2 text-cream text-sm focus:outline-none focus:border-gold';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-mauve/30 border border-cream/15 p-6">
      <h3 className="font-cormorant text-2xl text-cream font-light">
        {initial?.slug ? 'Edit project' : 'New project'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-cream/50 text-xs uppercase tracking-widest">Name</label>
          <input className={fieldClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="text-cream/50 text-xs uppercase tracking-widest">Slug</label>
          <input
            className={fieldClass}
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder={slugify(form.name)}
            disabled={Boolean(initial?.slug)}
          />
        </div>
        <div>
          <label className="text-cream/50 text-xs uppercase tracking-widest">Category</label>
          <select
            className={fieldClass}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {categories.filter((c) => c !== 'All').map((c) => (
              <option key={c} value={c} className="bg-sand">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-cream/50 text-xs uppercase tracking-widest">Location</label>
          <input className={fieldClass} value={form.location} onChange={(e) => set('location', e.target.value)} required />
        </div>
        <div>
          <label className="text-cream/50 text-xs uppercase tracking-widest">Year</label>
          <input className={fieldClass} value={form.year} onChange={(e) => set('year', e.target.value)} required />
        </div>
        <div>
          <label className="text-cream/50 text-xs uppercase tracking-widest">Area</label>
          <input className={fieldClass} value={form.area} onChange={(e) => set('area', e.target.value)} />
        </div>
        <div>
          <label className="text-cream/50 text-xs uppercase tracking-widest">Status</label>
          <input className={fieldClass} value={form.status} onChange={(e) => set('status', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="text-cream/50 text-xs uppercase tracking-widest">Cover image URL</label>
          <input className={fieldClass} value={form.image} onChange={(e) => set('image', e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label className="text-cream/50 text-xs uppercase tracking-widest">Gallery URLs (one per line)</label>
          <textarea
            className={`${fieldClass} min-h-[80px]`}
            value={form.galleryText}
            onChange={(e) => set('galleryText', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-cream/50 text-xs uppercase tracking-widest">Description</label>
          <textarea className={`${fieldClass} min-h-[100px]`} value={form.description} onChange={(e) => set('description', e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label className="text-cream/50 text-xs uppercase tracking-widest">Challenge</label>
          <textarea className={`${fieldClass} min-h-[80px]`} value={form.challenge} onChange={(e) => set('challenge', e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label className="text-cream/50 text-xs uppercase tracking-widest">Outcome</label>
          <textarea className={`${fieldClass} min-h-[80px]`} value={form.outcome} onChange={(e) => set('outcome', e.target.value)} required />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-gold text-cream px-6 py-2 text-xs tracking-widest uppercase font-dmsans hover:bg-gold/90 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save project'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-cream/30 text-cream px-6 py-2 text-xs tracking-widest uppercase font-dmsans hover:border-cream"
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

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['projects'] });

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
      await deleteProject(slug);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-sand text-cream">
      <header className="border-b border-cream/15 bg-mauve/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-cormorant text-3xl font-light">Project Admin</h1>
            <p className="font-dmsans text-cream/50 text-xs mt-1">{user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1 text-cream/60 text-xs tracking-widest uppercase hover:text-cream"
            >
              <ExternalLink size={14} /> View site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-cream/60 text-xs tracking-widest uppercase hover:text-cream"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {error && <p className="text-red-200 text-sm bg-red-900/20 p-3 border border-red-300/20">{error}</p>}

        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-gold text-cream px-5 py-2.5 text-xs tracking-widest uppercase font-dmsans hover:bg-gold/90"
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
            <Loader2 className="animate-spin text-cream/50" size={32} />
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div
                key={p.slug}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-mauve/25 border border-cream/15 p-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {p.image && (
                    <img src={p.image} alt="" className="w-16 h-12 object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-cormorant text-xl text-cream truncate">{p.name}</p>
                    <p className="font-dmsans text-cream/50 text-xs">
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
                    className="flex items-center gap-1 border border-cream/25 px-3 py-1.5 text-xs uppercase tracking-wider hover:border-gold"
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
      </main>
    </div>
  );
}

export default function Admin() {
  const { user, isAdmin, isLoadingAuth } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center p-6 text-cream text-center">
        <div>
          <p className="font-cormorant text-2xl mb-4">Supabase not configured</p>
          <p className="font-dmsans text-sm text-cream/60 mb-6">
            Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable the admin panel.
          </p>
          <Link to="/" className="text-gold text-xs uppercase tracking-widest">← Back to site</Link>
        </div>
      </div>
    );
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <Loader2 className="animate-spin text-cream/50" size={32} />
      </div>
    );
  }

  if (!user) return <AdminLogin />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center p-6 text-cream text-center">
        <div>
          <p className="font-cormorant text-2xl mb-4">Access denied</p>
          <p className="font-dmsans text-sm text-cream/60 mb-6">
            Your account is not an admin. Ask the site owner to run:
            <code className="block mt-2 text-xs bg-mauve/40 p-2">
              update profiles set role = &apos;admin&apos; where email = &apos;your@email.com&apos;;
            </code>
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-gold text-xs uppercase tracking-widest mr-4"
          >
            Sign out
          </button>
          <Link to="/" className="text-cream/50 text-xs uppercase tracking-widest">← Back to site</Link>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
