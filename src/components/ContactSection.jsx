import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { submitContactInquiry } from '@/lib/projects';
import { isSupabaseConfigured } from '@/lib/supabase';

const projectTypes = ['New Build', 'Renovation', 'Consultation', 'Other'];

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', type: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSupabaseConfigured) {
        await submitContactInquiry(form);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1400));
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-32 px-6 md:px-16 bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <p className="font-dmsans text-gold text-xs tracking-[0.35em] uppercase mb-8">Get In Touch</p>
            <h2 className="font-cormorant text-offwhite font-light leading-tight mb-16"
              style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)' }}>
              Let's Build Something<br />Extraordinary
            </h2>

            <div className="space-y-8">
              <div>
                <p className="font-dmsans text-offwhite/30 text-xs tracking-widest uppercase mb-2">Studio Address</p>
                <p className="font-dmsans text-offwhite/70 text-sm leading-relaxed">
                  123 Design Quarter<br />Sandton, Johannesburg<br />South Africa, 2196
                </p>
              </div>
              <div>
                <p className="font-dmsans text-offwhite/30 text-xs tracking-widest uppercase mb-2">Email</p>
                <a href="mailto:hello@mmdesigngroup.co.za"
                  className="font-dmsans text-offwhite/70 text-sm hover:text-gold transition-colors duration-300">
                  hello@mmdesigngroup.co.za
                </a>
              </div>
              <div>
                <p className="font-dmsans text-offwhite/30 text-xs tracking-widest uppercase mb-2">Phone</p>
                <a href="tel:+27110000000"
                  className="font-dmsans text-offwhite/70 text-sm hover:text-gold transition-colors duration-300">
                  +27 11 000 0000
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {error && (
                    <p className="font-dmsans text-red-400/90 text-sm">{error}</p>
                  )}
                  {[
                    { name: 'name', label: 'Name', type: 'text', placeholder: 'Your full name' },
                    { name: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
                  ].map(field => (
                    <div key={field.name}>
                      <label className="font-dmsans text-offwhite/40 text-xs tracking-widest uppercase block mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required
                        className="w-full bg-transparent border-b border-white/15 py-3 font-dmsans text-offwhite text-sm placeholder:text-offwhite/25 focus:outline-none focus:border-gold transition-colors duration-300"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="font-dmsans text-offwhite/40 text-xs tracking-widest uppercase block mb-2">
                      Project Type
                    </label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      required
                      className="w-full bg-nearblack border-b border-white/15 py-3 font-dmsans text-offwhite text-sm focus:outline-none focus:border-gold transition-colors duration-300"
                    >
                      <option value="" disabled>Select type</option>
                      {projectTypes.map(t => (
                        <option key={t} value={t} className="bg-nearblack">{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-dmsans text-offwhite/40 text-xs tracking-widest uppercase block mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Tell us about your project..."
                      required
                      className="w-full bg-transparent border-b border-white/15 py-3 font-dmsans text-offwhite text-sm placeholder:text-offwhite/25 focus:outline-none focus:border-gold transition-colors duration-300 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 w-full bg-gold text-nearblack font-dmsans text-xs tracking-[0.3em] uppercase py-4 hover:bg-gold/85 transition-colors duration-300 disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center h-full py-24 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  >
                    <CheckCircle className="text-gold mb-6" size={56} strokeWidth={1} />
                  </motion.div>
                  <h3 className="font-cormorant text-offwhite text-3xl font-light mb-4">
                    Message Received
                  </h3>
                  <p className="font-dmsans text-offwhite/45 text-sm leading-relaxed max-w-xs">
                    Thank you for reaching out. A member of our studio will be in contact within 48 hours.
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