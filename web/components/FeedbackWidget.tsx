import React, { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type FeedbackEntry = {
  id: string;
  rating: string;
  pageExperience: string;
  usefulFeature: string;
  suggestion: string;
  email: string;
  pageUrl: string;
  createdAt: string;
};

const STORAGE_KEY = 'swimlive_feedback';
const FEEDBACK_EMAIL = 'projectswimlive@gmail.com';
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`;

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [rating, setRating] = useState('');
  const [pageExperience, setPageExperience] = useState('');
  const [usefulFeature, setUsefulFeature] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [email, setEmail] = useState('');

  const saveFeedback = (entry: FeedbackEntry) => {
    const existing = localStorage.getItem(STORAGE_KEY);
    const feedbackList: FeedbackEntry[] = existing ? JSON.parse(existing) : [];

    feedbackList.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackList));
  };

  const resetForm = () => {
    setRating('');
    setPageExperience('');
    setUsefulFeature('');
    setSuggestion('');
    setEmail('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const entry: FeedbackEntry = {
      id: crypto.randomUUID(),
      rating,
      pageExperience,
      usefulFeature,
      suggestion,
      email,
      pageUrl: window.location.href,
      createdAt: new Date().toISOString(),
    };

    try {
      saveFeedback(entry);

      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: 'New SwimLive Feedback',
          _template: 'table',
          rating: entry.rating,
          page_experience: entry.pageExperience,
          useful_feature: entry.usefulFeature || 'Not provided',
          suggestion: entry.suggestion,
          user_email: entry.email || 'Not provided',
          page_url: entry.pageUrl,
          submitted_at: entry.createdAt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback email');
      }

      setSubmitted(true);
      resetForm();

      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 2000);
    } catch (submitError) {
      console.error('Feedback submit error:', submitError);
      setError('Could not send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-[320px] rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between border-b border-slate-700/70 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Share your feedback
                </h3>
                <p className="text-xs text-slate-400">
                  Help us improve SwimLive.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close feedback form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <CheckCircle className="mb-3 h-9 w-9 text-cyan-400" />
                <p className="text-sm font-semibold text-white">
                  Thanks for your feedback!
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Your response was sent to {FEEDBACK_EMAIL}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    How would you rate your experience?
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                  >
                    <option value="">Select a rating</option>
                    <option value="5 - Excellent">5 - Excellent</option>
                    <option value="4 - Good">4 - Good</option>
                    <option value="3 - Okay">3 - Okay</option>
                    <option value="2 - Needs work">2 - Needs work</option>
                    <option value="1 - Poor">1 - Poor</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    What were you trying to do?
                  </label>
                  <select
                    value={pageExperience}
                    onChange={(e) => setPageExperience(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                  >
                    <option value="">Choose one</option>
                    <option value="Read swimming news">Read swimming news</option>
                    <option value="Find athletes">Find athletes</option>
                    <option value="Check events">Check events</option>
                    <option value="Explore content">Explore content</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Most useful feature
                  </label>
                  <input
                    value={usefulFeature}
                    onChange={(e) => setUsefulFeature(e.target.value)}
                    placeholder="Example: Latest News, Athletes, Events..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Suggestions
                  </label>
                  <textarea
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    required
                    rows={3}
                    placeholder="What should we improve?"
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Email optional
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Sending...' : 'Submit feedback'}
                  <Send className="h-4 w-4" />
                </button>

                <p className="text-center text-[11px] text-slate-500">
                  Feedback will be sent to {FEEDBACK_EMAIL}.
                </p>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-400"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </button>
    </div>
  );
}