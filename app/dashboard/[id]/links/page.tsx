"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";
import { useTheme, tokens, inputStyle } from "../../theme-context";
import { Trash2, ExternalLink, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Link = { id: string; label: string; url: string; position: number; }

export default function LinksEditorPage() {
  const [links, setLinks]     = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel]     = useState("");
  const [url, setUrl]         = useState("");
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
      const { data, error } = await supabase.from('links').select('*').eq('event_id', id).order('position')
      if (error) { console.error(error); return; }
      setLinks(data ?? []); setLoading(false)
    }
    load()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!label || !url) return
    setSaving(true)
    const { data, error } = await supabase
      .from('links').insert({ event_id: id, label, url, position: links.length }).select().single()
    if (error) { console.error(error); setSaving(false); return; }
    setLinks([...links, data]); setLabel(""); setUrl(""); setSaving(false)
  }

  async function handleDelete(linkId: string) {
    await supabase.from('links').delete().eq('id', linkId)
    setLinks(links.filter(l => l.id !== linkId))
  }

  const lbl = { color: t.textSub, fontSize: "13px", fontWeight: 500 } as React.CSSProperties

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
        <h1 className="text-[32px] font-semibold tracking-tight mb-1" style={{ color: t.text }}>Links</h1>
        <p className="text-[15px]" style={{ color: t.textSub }}>{links.length} link{links.length !== 1 ? 's' : ''}</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        onSubmit={handleAdd}
        className="flex flex-col gap-4 mb-8 p-6 rounded-2xl"
        style={{ background: t.surface, border: `1px solid ${t.border}` }}
      >
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={lbl}>Label</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Spotify Playlist" style={inputStyle(t)} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={lbl}>URL</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://..." style={inputStyle(t)} />
          </div>
        </div>
        <div className="flex justify-end">
          <motion.button
            type="submit" disabled={saving || !label || !url} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-medium disabled:opacity-40 hover:opacity-80 transition-opacity"
            style={{ background: t.btnBg, color: t.btnText }}
          >
            <Plus size={15} /> {saving ? "Adding..." : "Add link"}
          </motion.button>
        </div>
      </motion.form>

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {links.length === 0 && (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[15px] text-center py-16" style={{ color: t.textFaint }}>
              No links yet
            </motion.p>
          )}
          {links.map((link, i) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-between px-5 py-4 rounded-2xl gap-4"
              style={{ border: `1px solid ${t.border}` }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium" style={{ color: t.text }}>{link.label}</p>
                <p className="text-[13px] mt-1 truncate" style={{ color: t.textFaint }}>{link.url}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={link.url} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-colors" style={{ color: t.textFaint }}
                  onMouseEnter={e => (e.currentTarget.style.color = t.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}
                >
                  <ExternalLink size={15} />
                </a>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(link.id)}
                  className="p-2 rounded-lg transition-colors" style={{ color: t.textFaint }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}
                >
                  <Trash2 size={15} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}