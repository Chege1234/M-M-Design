import { useState, useEffect, useMemo } from 'react';
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
  categories as staticCategories,
  createCategory,
  fetchContactReports,
  updateReportStatus,
  fetchLeads,
  updateLeadStatus,
  fetchAdminNotes,
  createAdminNote,
  updateAdminNote,
  deleteAdminNote,
} from '@/lib/projects';
import { useCategories } from '@/hooks/use-projects';
import { deleteProjectImages } from '@/lib/imageUpload';
import ImageDropZone from '@/components/ImageDropZone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Plus, Pencil, Trash2, LogOut, ExternalLink,
  LayoutDashboard, FolderKanban, Users, FileText, StickyNote, Tags,
  ChevronDown, ChevronRight, X, Check, Clock, CheckCircle2,
  Mail, Phone, MapPin, Calendar, DollarSign, ArrowUpRight,
  MessageSquare, Search, RefreshCw, Menu,
} from 'lucide-react';

// ─── Utility ────────────────────────────────────────────────────────────────

function formatDate(dateStr, includeTime = false) {
  if (!dateStr) return '—';
  const opts = { year: 'numeric', month: 'short', day: 'numeric' };
  if (includeTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return new Date(dateStr).toLocaleDateString(undefined, opts);
}

function formatDayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function isToday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime();
}

// ─── Shared Components ──────────────────────────────────────────────────────

function StatusBadge({ status, onChange }) {
  const isOngoing = status === 'Ongoing';
  return (
    <button
      onClick={() => onChange(isOngoing ? 'Completed' : 'Ongoing')}
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[0.65rem] font-body tracking-wider uppercase transition-all duration-200 cursor-pointer border ${
        isOngoing
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
      }`}
    >
      {isOngoing ? <Clock size={11} /> : <CheckCircle2 size={11} />}
      {status}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, accent = false, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-panel/40 backdrop-blur-sm border border-linen/10 p-5 group hover:border-linen/20 transition-all duration-300 ${
        accent ? 'border-l-2 border-l-bronze' : ''
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-linen/[0.02] to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.6rem] font-body tracking-[0.2em] uppercase text-stone">{label}</span>
          <Icon size={15} className="text-stone/60 group-hover:text-bronze transition-colors duration-300" />
        </div>
        <p className="font-display text-3xl text-linen font-light tracking-tight">{value}</p>
        {sub && <p className="font-body text-[0.65rem] text-stone mt-1.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border border-linen/8 bg-panel/10">
      <Icon size={32} className="text-stone/40 mb-3" strokeWidth={1} />
      <p className="font-body text-sm text-stone/60">{message}</p>
    </div>
  );
}

// ─── Project Form (unchanged logic, refined styling) ────────────────────────

const emptyProject = () => ({
  slug: '',
  name: '',
  category: staticCategories[1] ?? 'Contemporary Houses',
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

function ProjectForm({ initial, onSave, onCancel, saving, categories = [] }) {
  const [form, setForm] = useState(initial ?? emptyProject());
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');

  useEffect(() => {
    setForm(initial ?? emptyProject());
    setIsCustomCategory(false);
    setCustomCategoryText('');
  }, [initial]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? customCategoryText.trim() : form.category;
    if (isCustomCategory && !finalCategory) {
      alert('Please enter a category name');
      return;
    }
    onSave({
      ...formToProject({ ...form, category: finalCategory }),
      _isNewCategory: isCustomCategory,
    });
  };

  const fieldClass =
    'w-full bg-ink/60 border border-linen/12 px-3 py-2.5 text-linen text-sm focus:outline-none focus:border-bronze/60 transition-colors duration-200 placeholder:text-stone/50';

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onSubmit={handleSubmit}
      className="space-y-5 bg-panel/30 border border-linen/12 p-6 backdrop-blur-sm"
    >
      <h3 className="font-display text-2xl text-linen font-light">
        {initial?.slug ? 'Edit project' : 'New project'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body block mb-1.5">Name</label>
          <input className={fieldClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body block mb-1.5">Slug</label>
          <input className={fieldClass} value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.name)} disabled={Boolean(initial?.slug)} />
        </div>
        <div>
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body block mb-1.5">Category</label>
          {!isCustomCategory ? (
            <div className="flex gap-2">
              <select className={fieldClass} value={form.category} onChange={(e) => e.target.value === 'custom' ? setIsCustomCategory(true) : set('category', e.target.value)}>
                {categories.map((c) => <option key={c} value={c} className="bg-ink">{c}</option>)}
                <option value="custom" className="bg-ink text-bronze font-semibold">+ Create custom category...</option>
              </select>
            </div>
          ) : (
            <div className="flex gap-2">
              <input type="text" className={fieldClass} placeholder="Enter new category name" value={customCategoryText} onChange={(e) => setCustomCategoryText(e.target.value)} required />
              <button type="button" onClick={() => { setIsCustomCategory(false); setCustomCategoryText(''); }} className="border border-linen/25 px-3 text-linen text-xs hover:border-linen shrink-0 cursor-pointer transition-colors">Cancel</button>
            </div>
          )}
        </div>
        <div>
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body block mb-1.5">Location</label>
          <input className={fieldClass} value={form.location} onChange={(e) => set('location', e.target.value)} required />
        </div>
        <div>
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body block mb-1.5">Year</label>
          <input className={fieldClass} value={form.year} onChange={(e) => set('year', e.target.value)} required />
        </div>
        <div>
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body block mb-1.5">Area</label>
          <input className={fieldClass} value={form.area} onChange={(e) => set('area', e.target.value)} />
        </div>
        <div>
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body block mb-1.5">Status</label>
          <input className={fieldClass} value={form.status} onChange={(e) => set('status', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body mb-2 block">Cover image</label>
          <ImageDropZone value={form.image ? [form.image] : []} onChange={(urls) => set('image', urls[0] || '')} projectSlug={form.slug || slugify(form.name) || 'new-project'} multiple={false} label="Drop cover image here or click to browse" />
        </div>
        <div className="md:col-span-2">
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body mb-2 block">Gallery images</label>
          <ImageDropZone value={form.galleryUrls} onChange={(urls) => set('galleryUrls', urls)} projectSlug={form.slug || slugify(form.name) || 'new-project'} multiple={true} label="Drop gallery images here or click to browse" />
        </div>
        <div className="md:col-span-2">
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body block mb-1.5">Description</label>
          <textarea className={`${fieldClass} min-h-[100px]`} value={form.description} onChange={(e) => set('description', e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body block mb-1.5">Challenge</label>
          <textarea className={`${fieldClass} min-h-[80px]`} value={form.challenge} onChange={(e) => set('challenge', e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label className="text-stone text-[0.6rem] uppercase tracking-[0.2em] font-body block mb-1.5">Outcome</label>
          <textarea className={`${fieldClass} min-h-[80px]`} value={form.outcome} onChange={(e) => set('outcome', e.target.value)} required />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="bg-bronze text-ink px-6 py-2.5 text-xs tracking-widest uppercase font-body hover:bg-bronze/90 disabled:opacity-60 transition-colors cursor-pointer">
          {saving ? 'Saving...' : 'Save project'}
        </button>
        <button type="button" onClick={onCancel} className="border border-linen/25 text-linen px-6 py-2.5 text-xs tracking-widest uppercase font-body hover:border-linen transition-colors cursor-pointer">
          Cancel
        </button>
      </div>
    </motion.form>
  );
}

// ─── Notes Section ──────────────────────────────────────────────────────────

function NotesSection() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminNotes();
      setNotes(data);
      // Auto-expand today
      const todayKey = new Date().toISOString().split('T')[0];
      setExpandedDays(new Set([todayKey]));
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotes(); }, []);

  const groupedNotes = useMemo(() => {
    const groups = {};
    for (const note of notes) {
      const key = note.note_date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(note);
    }
    return groups;
  }, [notes]);

  const sortedDays = useMemo(() =>
    Object.keys(groupedNotes).sort((a, b) => b.localeCompare(a)),
  [groupedNotes]);

  const toggleDay = (day) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim()) return;
    setSaving(true);
    try {
      await createAdminNote({ title: newNote.title.trim(), content: newNote.content.trim(), note_date: new Date().toISOString().split('T')[0] });
      setNewNote({ title: '', content: '' });
      setCreating(false);
      await loadNotes();
    } catch (err) {
      alert(err.message || 'Failed to create note');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await updateAdminNote(id, { title: editForm.title.trim(), content: editForm.content.trim() });
      setEditingId(null);
      await loadNotes();
    } catch (err) {
      alert(err.message || 'Failed to update note');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await deleteAdminNote(id);
      await loadNotes();
    } catch (err) {
      alert(err.message || 'Failed to delete note');
    }
  };

  const fieldClass = 'w-full bg-ink/60 border border-linen/12 px-3 py-2.5 text-linen text-sm focus:outline-none focus:border-bronze/60 transition-colors duration-200 placeholder:text-stone/50';

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-stone/50" size={28} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-light text-linen">Notes</h2>
          <p className="font-body text-xs text-stone mt-1">Grouped by day · {notes.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadNotes} className="p-2 border border-linen/15 text-stone hover:text-linen hover:border-linen/30 transition-all cursor-pointer" title="Refresh">
            <RefreshCw size={14} />
          </button>
          {!creating && (
            <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 bg-bronze text-ink px-4 py-2 text-xs tracking-widest uppercase font-body hover:bg-bronze/90 cursor-pointer transition-colors">
              <Plus size={14} /> New note
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {creating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-panel/30 border border-linen/12 p-5 space-y-3 overflow-hidden"
          >
            <input type="text" className={fieldClass} placeholder="Note title..." value={newNote.title} onChange={(e) => setNewNote(p => ({ ...p, title: e.target.value }))} required />
            <textarea className={`${fieldClass} min-h-[80px]`} placeholder="Content (optional)..." value={newNote.content} onChange={(e) => setNewNote(p => ({ ...p, content: e.target.value }))} />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-bronze text-ink px-5 py-2 text-xs tracking-widest uppercase font-body hover:bg-bronze/90 disabled:opacity-60 cursor-pointer transition-colors">
                {saving ? 'Saving...' : 'Add note'}
              </button>
              <button type="button" onClick={() => setCreating(false)} className="border border-linen/25 text-linen px-5 py-2 text-xs tracking-widest uppercase font-body hover:border-linen cursor-pointer transition-colors">
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {sortedDays.length === 0 && !creating ? (
        <EmptyState icon={StickyNote} message="No notes yet. Create your first note above." />
      ) : (
        <div className="space-y-2">
          {sortedDays.map(day => {
            const dayNotes = groupedNotes[day];
            const expanded = expandedDays.has(day);
            const dayIsToday = isToday(day);
            return (
              <div key={day} className="border border-linen/10 bg-panel/15 overflow-hidden">
                <button
                  onClick={() => toggleDay(day)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-panel/30 transition-colors cursor-pointer ${
                    dayIsToday ? 'border-l-2 border-l-bronze' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronRight size={14} className="text-stone" />
                    </motion.div>
                    <span className="font-display text-lg text-linen font-light">{formatDayKey(day)}</span>
                    {dayIsToday && (
                      <span className="text-[0.55rem] bg-bronze/20 text-bronze px-2 py-0.5 tracking-wider uppercase font-body font-semibold">
                        today
                      </span>
                    )}
                  </div>
                  <span className="font-body text-xs text-stone">{dayNotes.length} note{dayNotes.length !== 1 ? 's' : ''}</span>
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-3 border-t border-linen/8">
                        {dayNotes.map(note => (
                          <div key={note.id} className="bg-ink/40 border border-linen/8 p-4 mt-3 group">
                            {editingId === note.id ? (
                              <div className="space-y-2">
                                <input type="text" className={fieldClass} value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} />
                                <textarea className={`${fieldClass} min-h-[60px]`} value={editForm.content} onChange={(e) => setEditForm(f => ({ ...f, content: e.target.value }))} />
                                <div className="flex gap-2">
                                  <button onClick={() => handleUpdate(note.id)} className="bg-bronze text-ink px-4 py-1.5 text-xs tracking-wider uppercase font-body cursor-pointer hover:bg-bronze/90 transition-colors">Save</button>
                                  <button onClick={() => setEditingId(null)} className="border border-linen/25 text-linen px-4 py-1.5 text-xs tracking-wider uppercase font-body cursor-pointer hover:border-linen transition-colors">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h4 className="font-display text-base text-linen font-light truncate">{note.title}</h4>
                                    {note.content && (
                                      <p className="font-body text-xs text-stone/70 mt-1.5 leading-relaxed whitespace-pre-wrap line-clamp-3">{note.content}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                                    <button
                                      onClick={() => { setEditingId(note.id); setEditForm({ title: note.title, content: note.content }); }}
                                      className="p-1.5 text-stone hover:text-linen transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(note.id)} className="p-1.5 text-stone hover:text-red-300 transition-colors cursor-pointer" title="Delete">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                                <p className="font-body text-[0.6rem] text-stone/40 mt-2">
                                  {new Date(note.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Admin Login ────────────────────────────────────────────────────────────

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-panel/40 backdrop-blur-sm border border-linen/15 p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-bronze/20 border border-bronze/30 flex items-center justify-center">
            <LayoutDashboard size={16} className="text-bronze" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-linen font-light">M&M Admin</h1>
            <p className="font-body text-stone text-[0.6rem] tracking-widest uppercase">Studio Dashboard</p>
          </div>
        </div>
        {error && <p className="text-red-300/90 text-xs mb-4 bg-red-900/20 p-2.5 border border-red-300/20 font-body">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-ink border border-linen/12 px-4 py-3 text-linen text-sm focus:outline-none focus:border-bronze/60 transition-colors placeholder:text-stone/50" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-ink border border-linen/12 px-4 py-3 text-linen text-sm focus:outline-none focus:border-bronze/60 transition-colors placeholder:text-stone/50" required />
          <button type="submit" disabled={loading} className="w-full bg-bronze text-ink py-3 text-xs tracking-widest uppercase font-body hover:bg-bronze/90 disabled:opacity-60 transition-colors cursor-pointer">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <Link to="/" className="block text-center mt-6 text-stone text-xs hover:text-linen transition-colors">← Back to site</Link>
      </motion.div>
    </div>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────────────────

function AdminDashboard() {
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const { data: dbCategories = [] } = useCategories();
  const dynamicCategories = dbCategories;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const data = await fetchContactReports();
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadLeads();
      loadReports();
    }
  }, [user]);

  const handleSave = async (projectData, originalSlug) => {
    setSaving(true);
    setError('');
    const { _isNewCategory, ...project } = projectData;
    try {
      if (_isNewCategory) await createCategory(project.category);
      if (originalSlug) await updateProject(originalSlug, project);
      else await createProject(project, projects.length + 1);
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

  const handleLeadStatusChange = async (id, status) => {
    try {
      await updateLeadStatus(id, status);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleReportStatusChange = async (id, status) => {
    try {
      await updateReportStatus(id, status);
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName('');
      await refresh();
    } catch (err) {
      alert(err.message || 'Failed to create category');
    } finally {
      setSavingCategory(false);
    }
  };

  // ── Stats ──
  const ongoingLeads = leads.filter((l) => l.status === 'Ongoing').length;
  const completedLeads = leads.filter((l) => l.status === 'Completed').length;
  const ongoingReports = reports.filter((r) => r.status === 'Ongoing').length;
  const completedReports = reports.filter((r) => r.status === 'Completed').length;

  // ── Nav items ──
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban, count: projects.length },
    { id: 'leads', label: 'Leads', icon: Users, count: ongoingLeads || null },
    { id: 'reports', label: 'Reports', icon: FileText, count: ongoingReports || null },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'categories', label: 'Categories', icon: Tags, count: dynamicCategories.length },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-linen/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-bronze/15 border border-bronze/25 flex items-center justify-center shrink-0">
            <LayoutDashboard size={16} className="text-bronze" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base text-linen font-light truncate">M&M Admin</h2>
            <p className="font-body text-[0.55rem] text-stone tracking-[0.2em] uppercase truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all duration-200 cursor-pointer group ${
              activeTab === id
                ? 'bg-bronze/10 border-l-2 border-l-bronze text-linen'
                : 'text-stone hover:text-linen hover:bg-panel/50 border-l-2 border-l-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={15} className={activeTab === id ? 'text-bronze' : 'text-stone group-hover:text-linen transition-colors'} />
              <span className="font-body text-xs tracking-wider uppercase">{label}</span>
            </div>
            {count > 0 && (
              <span className={`text-[0.6rem] font-body font-bold px-1.5 py-0.5 leading-none ${
                activeTab === id ? 'bg-bronze/20 text-bronze' : 'bg-panel text-stone'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-linen/8 space-y-1">
        <Link to="/" className="flex items-center gap-2.5 px-3 py-2 text-stone text-xs tracking-wider uppercase font-body hover:text-linen transition-colors">
          <ExternalLink size={14} /> View site
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-stone text-xs tracking-wider uppercase font-body hover:text-linen transition-colors text-left cursor-pointer">
          <LogOut size={14} /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-ink text-linen flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-60 bg-slate/50 border-r border-linen/8 flex-col shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* ── Mobile menu overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-ink/80 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate border-r border-linen/10 z-50 flex flex-col"
            >
              <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 text-stone hover:text-linen cursor-pointer">
                <X size={18} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-slate/90 backdrop-blur-md border-b border-linen/10 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(true)} className="p-1 text-stone hover:text-linen cursor-pointer">
            <Menu size={20} />
          </button>
          <h1 className="font-display text-lg text-linen font-light">M&M Admin</h1>
          <div className="w-7" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-200 text-sm bg-red-900/20 p-3 border border-red-300/20 font-body"
            >
              {error}
            </motion.p>
          )}

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div>
                <h1 className="font-display text-3xl lg:text-4xl text-linen font-light mb-1">Dashboard</h1>
                <p className="font-body text-xs text-stone">Welcome back · {formatDate(new Date().toISOString())}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={FolderKanban} label="Projects" value={projects.length} accent />
                <StatCard icon={Users} label="Leads" value={leads.length} sub={`${ongoingLeads} ongoing · ${completedLeads} completed`} />
                <StatCard icon={FileText} label="Reports" value={reports.length} sub={`${ongoingReports} ongoing · ${completedReports} completed`} />
                <StatCard icon={Tags} label="Categories" value={dynamicCategories.length} />
              </div>

              {/* Recent activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent leads */}
                <div className="bg-panel/20 border border-linen/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg text-linen font-light">Recent Leads</h3>
                    <button onClick={() => setActiveTab('leads')} className="text-[0.6rem] font-body tracking-widest uppercase text-bronze hover:text-bronze/80 cursor-pointer transition-colors flex items-center gap-1">
                      View all <ArrowUpRight size={10} />
                    </button>
                  </div>
                  {leads.slice(0, 3).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between py-2.5 border-b border-linen/5 last:border-0">
                      <div className="min-w-0">
                        <p className="font-body text-sm text-linen truncate">{lead.client_name}</p>
                        <p className="font-body text-[0.6rem] text-stone">{lead.project_type || 'Inquiry'} · {formatDate(lead.created_at)}</p>
                      </div>
                      <StatusBadge status={lead.status} onChange={(s) => handleLeadStatusChange(lead.id, s)} />
                    </div>
                  ))}
                  {leads.length === 0 && <p className="font-body text-xs text-stone/50 py-4 text-center">No leads yet</p>}
                </div>

                {/* Recent reports */}
                <div className="bg-panel/20 border border-linen/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg text-linen font-light">Recent Reports</h3>
                    <button onClick={() => setActiveTab('reports')} className="text-[0.6rem] font-body tracking-widest uppercase text-bronze hover:text-bronze/80 cursor-pointer transition-colors flex items-center gap-1">
                      View all <ArrowUpRight size={10} />
                    </button>
                  </div>
                  {reports.slice(0, 3).map(report => (
                    <div key={report.id} className="flex items-center justify-between py-2.5 border-b border-linen/5 last:border-0">
                      <div className="min-w-0">
                        <p className="font-body text-sm text-linen truncate">{report.name}</p>
                        <p className="font-body text-[0.6rem] text-stone">{report.project_type || 'Contact'} · {formatDate(report.created_at)}</p>
                      </div>
                      <StatusBadge status={report.status} onChange={(s) => handleReportStatusChange(report.id, s)} />
                    </div>
                  ))}
                  {reports.length === 0 && <p className="font-body text-xs text-stone/50 py-4 text-center">No reports yet</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Projects ── */}
          {activeTab === 'projects' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-light text-linen">Projects</h2>
                  <p className="font-body text-xs text-stone mt-1">{projects.length} projects</p>
                </div>
                {!creating && !editing && (
                  <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 bg-bronze text-ink px-4 py-2.5 text-xs tracking-widest uppercase font-body hover:bg-bronze/90 cursor-pointer transition-colors">
                    <Plus size={14} /> Add project
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {creating && (
                  <ProjectForm
                    categories={dynamicCategories}
                    onSave={(p) => handleSave(p, null)}
                    onCancel={() => setCreating(false)}
                    saving={saving}
                  />
                )}
                {editing && (
                  <ProjectForm
                    initial={projectToForm(editing)}
                    categories={dynamicCategories}
                    onSave={(p) => handleSave(p, editing.slug)}
                    onCancel={() => setEditing(null)}
                    saving={saving}
                  />
                )}
              </AnimatePresence>

              {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-stone/50" size={28} /></div>
              ) : (
                <div className="space-y-2">
                  {projects.map((p, i) => (
                    <motion.div
                      key={p.slug}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-panel/20 border border-linen/10 p-4 hover:border-linen/20 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {p.image && <img src={p.image} alt="" className="w-14 h-10 object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />}
                        <div className="min-w-0">
                          <p className="font-display text-lg text-linen truncate">{p.name}</p>
                          <p className="font-body text-stone text-[0.6rem] tracking-wider">{p.category} · {p.location} · {p.year}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => { setCreating(false); setEditing(p); }}
                          className="flex items-center gap-1 border border-linen/15 px-3 py-1.5 text-xs uppercase tracking-wider hover:border-bronze/50 text-stone hover:text-linen transition-all cursor-pointer"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.slug)}
                          className="flex items-center gap-1 border border-red-300/20 text-red-200/60 px-3 py-1.5 text-xs uppercase tracking-wider hover:border-red-300/40 hover:text-red-200 transition-all cursor-pointer"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Leads ── */}
          {activeTab === 'leads' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-light text-linen">Leads</h2>
                  <p className="font-body text-xs text-stone mt-1">
                    {leads.length} total · {ongoingLeads} ongoing · {completedLeads} completed
                  </p>
                </div>
                <button onClick={loadLeads} className="p-2 border border-linen/15 text-stone hover:text-linen hover:border-linen/30 transition-all cursor-pointer" title="Refresh">
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Stats mini row */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard icon={Users} label="Total Leads" value={leads.length} />
                <StatCard icon={Clock} label="Ongoing" value={ongoingLeads} />
                <StatCard icon={CheckCircle2} label="Completed" value={completedLeads} />
              </div>

              {leadsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-stone/50" size={28} /></div>
              ) : leads.length === 0 ? (
                <EmptyState icon={Users} message="No leads captured yet." />
              ) : (
                <div className="space-y-3">
                  {leads.map((lead, i) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-panel/20 border border-linen/10 p-5 space-y-4 hover:border-linen/18 transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-display text-xl font-light text-linen leading-tight">{lead.client_name}</h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 font-body text-stone text-[0.65rem]">
                            {lead.email && (
                              <a href={`mailto:${lead.email}`} className="hover:text-bronze transition-colors flex items-center gap-1">
                                <Mail size={10} /> {lead.email}
                              </a>
                            )}
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`} className="hover:text-bronze transition-colors flex items-center gap-1">
                                <Phone size={10} /> {lead.phone}
                              </a>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar size={10} /> {formatDate(lead.created_at, true)}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={lead.status} onChange={(s) => handleLeadStatusChange(lead.id, s)} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-3 border-t border-b border-linen/8">
                        {[
                          { label: 'Type', value: lead.project_type },
                          { label: 'Location', value: lead.location },
                          { label: 'Scale', value: lead.scale },
                          { label: 'Timeline', value: lead.timeline },
                          { label: 'Budget', value: lead.budget_range },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <span className="block text-[0.55rem] uppercase tracking-[0.15em] text-stone mb-0.5 font-body font-semibold">{label}</span>
                            <span className="text-xs text-linen/75 font-body">{value || '—'}</span>
                          </div>
                        ))}
                      </div>

                      {lead.notes && (
                        <div>
                          <span className="block text-[0.55rem] uppercase tracking-[0.15em] text-stone font-body font-semibold mb-1">Notes</span>
                          <p className="text-xs text-linen/65 leading-relaxed font-body whitespace-pre-wrap">{lead.notes}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Reports ── */}
          {activeTab === 'reports' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-light text-linen">Reports</h2>
                  <p className="font-body text-xs text-stone mt-1">
                    Contact form submissions · {reports.length} total · {ongoingReports} ongoing · {completedReports} completed
                  </p>
                </div>
                <button onClick={loadReports} className="p-2 border border-linen/15 text-stone hover:text-linen hover:border-linen/30 transition-all cursor-pointer" title="Refresh">
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Stats mini row */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard icon={FileText} label="Total Reports" value={reports.length} />
                <StatCard icon={Clock} label="Ongoing" value={ongoingReports} />
                <StatCard icon={CheckCircle2} label="Completed" value={completedReports} />
              </div>

              {reportsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-stone/50" size={28} /></div>
              ) : reports.length === 0 ? (
                <EmptyState icon={FileText} message="No contact form reports yet." />
              ) : (
                <div className="space-y-3">
                  {reports.map((report, i) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-panel/20 border border-linen/10 p-5 hover:border-linen/18 transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <h3 className="font-display text-xl font-light text-linen leading-tight">{report.name}</h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 font-body text-stone text-[0.65rem]">
                            <a href={`mailto:${report.email}`} className="hover:text-bronze transition-colors flex items-center gap-1">
                              <Mail size={10} /> {report.email}
                            </a>
                            <span className="flex items-center gap-1">
                              <Calendar size={10} /> {formatDate(report.created_at, true)}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={report.status} onChange={(s) => handleReportStatusChange(report.id, s)} />
                      </div>

                      <div className="space-y-3 pt-3 border-t border-linen/8">
                        <div>
                          <span className="block text-[0.55rem] uppercase tracking-[0.15em] text-stone font-body font-semibold mb-0.5">Project Type</span>
                          <span className="text-xs text-linen/75 font-body">{report.project_type || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-[0.55rem] uppercase tracking-[0.15em] text-stone font-body font-semibold mb-0.5">Message</span>
                          <p className="text-xs text-linen/65 leading-relaxed font-body whitespace-pre-wrap">{report.message || '—'}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Notes ── */}
          {activeTab === 'notes' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <NotesSection />
            </motion.div>
          )}

          {/* ── Categories ── */}
          {activeTab === 'categories' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="font-display text-2xl font-light text-linen">Categories</h2>
              <form onSubmit={handleCreateCategory} className="flex gap-3">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="bg-ink/60 border border-linen/12 px-4 py-2.5 text-linen text-sm focus:outline-none focus:border-bronze/60 w-64 transition-colors placeholder:text-stone/50"
                  required
                />
                <button type="submit" disabled={savingCategory} className="bg-bronze text-ink px-6 py-2.5 text-xs tracking-widest uppercase font-body hover:bg-bronze/90 disabled:opacity-60 cursor-pointer transition-colors">
                  {savingCategory ? 'Adding...' : 'Add Category'}
                </button>
              </form>
              <div className="space-y-1.5 mt-4">
                {dynamicCategories.map((cat, i) => (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-panel/20 border border-linen/10 px-4 py-3 flex justify-between items-center hover:border-linen/18 transition-all duration-200"
                  >
                    <span className="font-display text-lg text-linen font-light">{cat}</span>
                    <Tags size={14} className="text-stone/40" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Entry ──────────────────────────────────────────────────────────────────

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
        <Loader2 className="animate-spin text-stone/50" size={32} />
      </div>
    );
  }

  if (!user) return <AdminLogin />;

  return <AdminDashboard />;
}
