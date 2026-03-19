"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase-client";
import { useRouter } from "next/navigation";
import { useTheme, tokens, inputStyle, btnPrimary } from "../theme-context";
import { motion, AnimatePresence } from "framer-motion";

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50)
}
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function NewEventPage() {
  const [title, setTitle]           = useState("");
  const [tagline, setTagline]       = useState("");
  const [slug, setSlug]             = useState("");
  const [accessCode, setAccessCode] = useState(() => generateCode());
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const router   = useRouter();
  const supabase = createClient();
  const { theme } = useTheme();
  const t = tokens(theme);

  function handleTitleChange(val: string) {
    setTitle(val);
    setSlug(generateSlug(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/dashboard/login"); return; }
    const { data, error } = await supabase
      .from('events').insert({ organizer_id: user.id, title, tagline, slug, access_code: accessCode })
      .select().single()
    if (error) { setError(error.message); setLoading(false); return; }
    router.push(`/dashboard/${data.id}`)
  }

  const lbl = { color: t.textSub, fontSize: "13px", fontWeight: 500 } as React.CSSProperties;

  const fields = [
    {
      label: "Event name *", key: "title",
      input: <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)}
        placeholder="e.g. Spring Retreat 2027" required style={inputStyle(t)} />
    },
    {
      label: "Tagline", key: "tagline",
      input: <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
        placeholder="e.g. A weekend to remember" style={inputStyle(t)} />
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="px-10 py-10 max-w-xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-[28px] font-semibold tracking-tight leading-none mb-1" style={{ color: t.text }}>
          New event
        </h1>
        <p className="text-[14px]" style={{ color: t.textSub }}>Fill in the basics to get started</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {fields.map((field, i) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05, duration: 0.4 }}
            className="flex flex-col gap-1.5"
          >
            <label style={lbl}>{field.label}</label>
            {field.input}
          </motion.div>
        ))}

        {/* Slug */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          className="flex flex-col gap-1.5"
        >
          <label style={lbl}>URL slug *</label>
          <div className="flex items-center overflow-hidden rounded-xl" style={{ border: `1px solid ${t.border}` }}>
            <span className="px-3 py-3 text-[14px] shrink-0"
              style={{ background: t.surface, color: t.textFaint, borderRight: `1px solid ${t.border}` }}>
              /e/
            </span>
            <input
              type="text" value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="spring-retreat-2027" required
              className="flex-1 px-3 py-3 text-[15px] outline-none"
              style={{ background: t.inputBg, color: t.text }}
            />
          </div>
        </motion.div>

        {/* Access code */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23, duration: 0.4 }}
          className="flex flex-col gap-1.5"
        >
          <label style={lbl}>Access code *</label>
          <div className="flex gap-2">
            <input
              type="text" value={accessCode}
              onChange={e => setAccessCode(e.target.value.toUpperCase())}
              required className="font-mono"
              style={{ ...inputStyle(t), width: 'auto', flex: 1 }}
            />
            <motion.button
              type="button" whileTap={{ scale: 0.97 }}
              onClick={() => setAccessCode(generateCode())}
              className="px-4 py-3 text-[14px] rounded-xl transition-colors shrink-0"
              style={{ background: t.surface, color: t.textSub, border: `1px solid ${t.border}` }}
            >
              Regenerate
            </motion.button>
          </div>
          <p className="text-[12px]" style={{ color: t.textFaint }}>Attendees enter this to access the event</p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[13px]" style={{ color: "#ef4444" }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit" disabled={loading}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          whileTap={{ scale: 0.98 }}
          className="py-3 rounded-xl text-[15px] font-medium disabled:opacity-50 mt-1"
          style={btnPrimary(t)}
        >
          {loading ? "Creating..." : "Create event →"}
        </motion.button>
      </form>
    </motion.div>
  )
}