import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
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
                  href="mailto:hello@mmdesigngroup.co.za"
                  className="font-body text-linen/80 text-sm hover:text-bronze transition-colors"
                >
                  hello@mmdesigngroup.co.za
                </a>
              </div>
              <div>
                <p className="font-body text-stone text-[0.65rem] tracking-widest uppercase mb-2">Phone</p>
                <a
                  href="tel:+905428727548"
                  className="font-body text-linen/80 text-sm hover:text-bronze transition-colors"
                >
                  +90 542 872 7548
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
