"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";
import { useTheme, tokens } from "../../theme-context";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_COLORS = [
  "#000000", "#ef4444", "#f97316", "#f59e0b",
  "#10b981", "#3b82f6", "#6366f1", "#8b5cf6",
]
const FONTS = [
  { value: "default", label: "Sans",  sample: "Aa" },
  { value: "serif",   label: "Serif", sample: "Aa" },
  { value: "mono",    label: "Mono",  sample: "Aa" },
]

type EventDesign = {
  primary_color: string; theme: string; font: string;
  tabs: { key: string; label: string; visible: boolean }[];
}

export default function DesignEditorPage() {
  const [design, setDesign] = useState<EventDesign>({
    primary_color: '#000000', theme: 'light', font: 'default',
    tabs: [
      { key: 'schedule',      label: 'Schedule',      visible: true },
      { key: 'groups',        label: 'Groups',        visible: true },
      { key: 'announcements', label: 'Announcements', visible: true },
      { key: 'links',         label: 'Links',         visible: true },
    ]
  })
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
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
        .from('events').select('primary_color, theme, font, tabs').eq('id', id).single()
      if (error) { console.error(error); return; }
      if (data) setDesign({
        primary_color: data.primary_color ?? '#000000',
        theme: data.theme ?? 'light',
        font: data.font ?? 'default',
        tabs: data.tabs ?? design.tabs,
      })
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('events').update(design).eq('id', id)
    if (error) { console.error(error); setSaving(false); return; }
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  function updateTab(key: string, field: 'label' | 'visible', value: string | boolean) {
    setDesign(prev => ({ ...prev, tabs: prev.tabs.map(tab => tab.key === key ? { ...tab, [field]: value } : tab) }))
  }

  const sectionLbl = {
    color: t.textSub, fontSize: "12px", fontWeight: 600,
    textTransform: "uppercase" as const, letterSpacing: "0.06em",
    marginBottom: "12px", display: "block"
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ color: t.textSub }}>Loading...</div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="px-10 py-10 max-w-2xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="text-[32px] font-semibold tracking-tight" style={{ color: t.text }}>Design</h1>
        <p className="text-[14px] mt-1" style={{ color: t.textSub }}>Customize how your event looks for attendees</p>
      </motion.div>

      <div className="flex flex-col gap-10">

        {/* Color */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <span style={sectionLbl}>Primary color</span>
          <div className="flex gap-2 flex-wrap mb-4">
            {PRESET_COLORS.map((color, i) => (
              <motion.button
                key={color}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12 + i * 0.03, duration: 0.3 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setDesign({ ...design, primary_color: color })}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: color,
                  outline: design.primary_color === color ? `2px solid ${color}` : 'none',
                  outlineOffset: '3px',
                }}
              >
                {design.primary_color === color && <Check size={14} color="#fff" />}
              </motion.button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input type="color" value={design.primary_color}
              onChange={e => setDesign({ ...design, primary_color: e.target.value })}
              className="w-9 h-9 rounded-lg cursor-pointer"
              style={{ border: `1px solid ${t.border}`, background: "none", padding: "2px" }}
            />
            <span className="text-[13px] font-mono" style={{ color: t.textSub }}>{design.primary_color}</span>
          </div>
        </motion.div>

        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
          <span style={sectionLbl}>Attendee theme</span>
          <div className="flex gap-2">
            {(['light', 'dark'] as const).map(th => (
              <motion.button
                key={th} whileTap={{ scale: 0.97 }}
                onClick={() => setDesign({ ...design, theme: th })}
                className="flex-1 py-4 rounded-xl text-[14px] font-medium capitalize flex items-center justify-center gap-2 transition-all"
                style={{
                  background: design.theme === th ? (th === 'dark' ? '#1a1a1a' : '#ffffff') : t.surface,
                  color: design.theme === th ? (th === 'dark' ? '#f0f0f0' : '#1a1a1a') : t.textFaint,
                  border: `1px solid ${design.theme === th ? (th === 'dark' ? '#333' : '#e0e0e0') : t.border}`,
                }}
              >
                {design.theme === th && <Check size={13} />}
                {th === 'light' ? 'Light' : 'Dark'}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Font */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <span style={sectionLbl}>Font</span>
          <div className="flex gap-2">
            {FONTS.map(f => (
              <motion.button
                key={f.value} whileTap={{ scale: 0.97 }}
                onClick={() => setDesign({ ...design, font: f.value })}
                className="flex-1 py-4 rounded-xl text-[13px] flex flex-col items-center gap-1.5 transition-all"
                style={{
                  background: design.font === f.value ? t.btnBg : t.surface,
                  color: design.font === f.value ? t.btnText : t.textSub,
                  border: `1px solid ${design.font === f.value ? 'transparent' : t.border}`,
                  fontFamily: f.value === 'serif' ? 'Georgia, serif' : f.value === 'mono' ? 'monospace' : 'inherit',
                }}
              >
                <span className="text-[20px]">{f.sample}</span>
                <span className="text-[11px] uppercase tracking-widest">{f.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
          <span style={sectionLbl}>Tabs</span>
          <div className="flex flex-col gap-2">
            {design.tabs.map((tab, i) => (
              <motion.div
                key={tab.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.27 + i * 0.04, duration: 0.3 }}
                className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ border: `1px solid ${t.border}`, background: t.surface }}
              >
                <button
                  onClick={() => updateTab(tab.key, 'visible', !tab.visible)}
                  className="shrink-0 w-9 h-5 rounded-full transition-all relative"
                  style={{ background: tab.visible ? t.btnBg : t.border }}
                >
                  <motion.span
                    animate={{ left: tab.visible ? '18px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full"
                    style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                  />
                </button>
                <input
                  type="text" value={tab.label}
                  onChange={e => updateTab(tab.key, 'label', e.target.value)}
                  disabled={!tab.visible}
                  className="flex-1 text-[14px] bg-transparent outline-none transition-colors"
                  style={{ color: tab.visible ? t.text : t.textFaint }}
                />
                <span className="text-[10px] uppercase tracking-widest shrink-0" style={{ color: t.textFaint }}>
                  {tab.key}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Save */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl text-[15px] font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
          style={{ background: t.btnBg, color: t.btnText }}
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2">
                <Check size={16} /> Saved
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {saving ? "Saving..." : "Save changes"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  )
}