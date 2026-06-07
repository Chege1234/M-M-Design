import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Mail } from 'lucide-react';
import { submitContactInquiry } from '@/lib/projects';
import { isSupabaseConfigured } from '@/lib/supabase';

const projectTypes = ['New Build', 'Renovation', 'Consultation', 'Other'];

const inputClass =
  'w-full bg-transparent border-b border-linen/15 py-3 font-body text-linen text-sm placeholder:text-stone focus:outline-none focus:border-bronze transition-colors';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', type: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSupabaseConfigured) {
        await submitContactInquiry(form);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-28 md:py-36 bg-ink border-t border-linen/8">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="section-label mb-6">Contact</p>
            <h2
              className="section-title mb-12"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            >
              Let&apos;s discuss your project
            </h2>

            <div className="space-y-8">
              <div>
                <p className="font-body text-stone text-[0.65rem] tracking-widest uppercase mb-2">Studio</p>
                <p className="font-body text-linen/80 text-sm leading-relaxed">
                  Nicosia, Cyprus
                </p>
              </div>
              <div>
                <p className="font-body text-stone text-[0.65rem] tracking-widest uppercase mb-2">Email</p>
                <a
                  href="mailto:madelinesavo64@gmail.com"
                  className="text-stone hover:text-bronze transition-colors"
                  aria-label="Send email"
                >
                  <Mail size={17} strokeWidth={1.5} />
                </a>
              </div>
              <div>
                <p className="font-body text-stone text-[0.65rem] tracking-widest uppercase mb-2">Phone</p>
                <a
                  href="https://wa.me/905428727548"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone hover:text-bronze transition-colors"
                  aria-label="Contact on WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-panel/50 border border-linen/10 p-8 md:p-10"
                >
                  {error && <p className="font-body text-red-300/90 text-sm">{error}</p>}
                  {[
                    { name: 'name', label: 'Name', type: 'text', placeholder: 'Your full name' },
                    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@email.com' },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="font-body text-stone text-[0.65rem] tracking-widest uppercase block mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required
                        className={inputClass}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="font-body text-stone text-[0.65rem] tracking-widest uppercase block mb-2">
                      Project type
                    </label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      required
                      className={`${inputClass} bg-panel`}
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      {projectTypes.map((t) => (
                        <option key={t} value={t} className="bg-panel">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-stone text-[0.65rem] tracking-widest uppercase block mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Tell us about your project..."
                      required
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-bronze text-ink font-body text-[0.65rem] tracking-[0.28em] uppercase py-4 hover:bg-bronze/90 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : 'Send message'}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center border border-linen/10 bg-panel/30 p-10"
                >
                  <CheckCircle className="text-bronze mb-6" size={48} strokeWidth={1} />
                  <h3 className="font-display text-linen text-2xl mb-3">Message received</h3>
                  <p className="font-body text-stone text-sm max-w-xs">
                    Thank you. We will be in touch within 48 hours.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
