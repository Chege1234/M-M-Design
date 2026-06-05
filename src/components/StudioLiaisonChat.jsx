import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { invokeLiaisonChat, isSupabaseConfigured } from '../lib/supabase';

const INITIAL_GREETING = "I'm Melba, Studio Liaison at M&M Design Group. Tell me about the project you have in mind";

/** Omit seeded greeting so the edge function sends a user-first history to Gemini. */
function messagesForApi(messages) {
  return messages.filter(
    (m, i) =>
      m.content !== '__FALLBACK__' &&
      !(i === 0 && m.role === 'assistant' && m.content === INITIAL_GREETING),
  );
}

export default function StudioLiaisonChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Seed the opening greeting locally so it is exact and not model-generated.
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: INITIAL_GREETING,
      },
    ]);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setHasOpened(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessageText = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Append user message locally
    const updatedMessages = [...messages, { role: 'user', content: userMessageText }];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      const data = await invokeLiaisonChat({
        messages: messagesForApi(updatedMessages),
        leadAlreadySaved,
      });

      if (data.reply === '__FALLBACK__') {
        setMessages((prev) => [...prev, { role: 'assistant', content: '__FALLBACK__' }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        if (data.leadSaved) {
          setLeadSaved(true);
        }
      }
    } catch (err) {
      console.error('Error in chatbot communication:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: '__FALLBACK__' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  // Auto-resize input textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="collapsed-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleOpen}
            className="w-14 h-14 bg-bronze text-ink rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
          >
            {/* Subtle pulse animation for visual interest on load */}
            {!hasOpened && (
              <span className="absolute inset-0 rounded-full bg-bronze/40 animate-ping pointer-events-none" />
            )}
            <MessageCircle size={26} />
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            key="expanded-panel"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[380px] h-[520px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] bg-ink border border-linen/20 flex flex-col rounded-none shadow-2xl overflow-hidden font-body"
          >
            {/* Header */}
            <div className="bg-panel border-b border-linen/10 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute inset-0 animate-ping" />
                </div>
                <div>
                  <h3 className="font-display text-base text-linen tracking-wider uppercase font-medium leading-none mb-1">
                    M&M Design Group
                  </h3>
                  <p className="text-[0.65rem] text-stone tracking-widest uppercase leading-none font-body">
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-linen/50 hover:text-linen transition-colors cursor-pointer p-1"
                aria-label="Close Chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 bg-ink scrollbar-thin">
              {messages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant';
                const isFallback = msg.content === '__FALLBACK__';

                return (
                  <div
                    key={index}
                    className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed rounded-none font-body text-linen ${
                        isAssistant
                          ? 'bg-panel border border-linen/5'
                          : 'bg-bronze/10 border border-bronze/20'
                      }`}
                    >
                      {isFallback ? (
                        <span>
                          I&apos;m having difficulty at the moment. Please reach out to us directly via the{' '}
                          <button
                            onClick={handleScrollToContact}
                            className="text-bronze underline hover:text-bronze/80 font-medium transition-colors cursor-pointer bg-transparent border-none p-0 inline font-body"
                          >
                            contact section
                          </button>{' '}
                          — our team responds within 24 hours.
                        </span>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-panel border border-linen/5 px-4 py-3 rounded-none flex items-center gap-1.5 self-start">
                    <span className="w-1.5 h-1.5 bg-linen/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-linen/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-linen/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Lead Saved Banner */}
            {leadSaved && (
              <div className="px-4 py-2.5 bg-bronze/10 border-t border-bronze/20 text-center shrink-0">
                <p className="font-body text-[0.65rem] text-bronze tracking-wider uppercase font-semibold">
                  ✓ Details received — we'll be in touch within 24 hours
                </p>
              </div>
            )}

            {/* Input Area — always visible */}
            <div className="p-4 bg-slate/50 border-t border-linen/10 flex items-end gap-2 shrink-0">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message M&M Design..."
                rows={1}
                className="flex-1 bg-slate border border-linen/15 focus:border-bronze focus:outline-none text-linen text-sm px-3.5 py-2.5 resize-none max-h-28 rounded-none transition-colors placeholder:text-stone font-body"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-bronze hover:bg-bronze/90 text-ink p-2.5 rounded-none disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
