"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";
import { useTheme, tokens } from "../../theme-context";
import { Trash2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Announcement = { id: string; body: string; created_at: string; }

export default function AnnouncementsEditorPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody]       = useState("");
  const [saving, setSaving]   = useState(false);
  const router   = useRouter();
  const { id }   = useParams();
  const supabase = createClient();
  const { theme } = useTheme();
  const t = tokens(theme);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }
      const { data, error } = await supabase
        .from('announcements').select('*').eq('event_id', id).order('created_at', { ascending: false })
      if (error) { console.error(error); return; }
      setAnnouncements(data ?? []); setLoading(false)
    }
    load()
  }, [])

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('announcements').insert({ event_id: id, body }).select().single()
    if (error) { console.error(error); setSaving(false); return; }
    setAnnouncements([data, ...announcements])
    setBody(""); setSaving(false)
  }

  async function handleDelete(announcementId: string) {
    await supabase.from('announcements').delete().eq('id', announcementId)
    setAnnouncements(announcements.filter(a => a.id !== announcementId))
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ color: t.textSub }}>Loading...</div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="px-12 py-12 max-w-3xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="text-[32px] font-semibold tracking-tight mb-1" style={{ color: t.text }}>Announcements</h1>
        <p className="text-[15px]" style={{ color: t.textSub }}>{announcements.length} posted</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        onSubmit={handlePost}
        className="flex flex-col gap-3 mb-8"
      >
        <textarea
          value={body} onChange={e => setBody(e.target.value)}
          placeholder="Write an announcement for your attendees..."
          rows={4}
          className="w-full rounded-2xl outline-none resize-none text-[15px]"
          style={{ background: t.inputBg, border: `1px solid ${t.border}`, color: t.text, padding: "16px", lineHeight: "1.6" }}
        />
        <div className="flex justify-end">
          <motion.button
            type="submit" disabled={saving || !body.trim()} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-medium disabled:opacity-40 hover:opacity-80 transition-opacity"
            style={{ background: t.btnBg, color: t.btnText }}
          >
            <Send size={14} /> {saving ? "Posting..." : "Post"}
          </motion.button>
        </div>
      </motion.form>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {announcements.length === 0 && (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[15px] text-center py-16" style={{ color: t.textFaint }}>
              No announcements yet
            </motion.p>
          )}
          {announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="px-5 py-4 rounded-2xl"
              style={{ border: `1px solid ${t.border}` }}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-[15px] leading-relaxed" style={{ color: t.text }}>{a.body}</p>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(a.id)}
                  className="shrink-0 p-2 rounded-lg transition-colors"
                  style={{ color: t.textFaint }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}
                >
                  <Trash2 size={15} />
                </motion.button>
              </div>
              <p className="text-[12px] mt-3" style={{ color: t.textFaint }}>{formatDate(a.created_at)}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}