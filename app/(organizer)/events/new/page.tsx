"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme, tokens, inputStyle, btnPrimary } from "../../../../lib/theme/theme-context";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { cacheClear } from "@/lib/cache";

// ── Event types ───────────────────────────────────────────────────────────────
type EventType = {
  key: string;
  label: string;
  emoji: string;
  desc: string;
  color: string;
  font: string;
  tabs: { key: string; label: string; visible: boolean }[];
  categories: string[];
}

const EVENT_TYPES: EventType[] = [
  {
    key: "retreat",
    label: "Retreat",
    emoji: "🏕️",
    desc: "Overnight or multi-day spiritual, team, or community retreat",
    color: "#4a7c59",
    font: "serif",
    categories: ["Session", "Prayer", "Meal", "Free", "Other"],
    tabs: [
      { key: "schedule",      label: "Schedule",      visible: true  },
      { key: "groups",        label: "Small Groups",  visible: true  },
      { key: "announcements", label: "Updates",       visible: true  },
      { key: "links",         label: "Links",         visible: true  },
    ],
  },
  {
    key: "hackathon",
    label: "Hackathon",
    emoji: "💻",
    desc: "Multi-day build event with team assignments and a tight schedule",
    color: "#3b82f6",
    font: "mono",
    categories: ["Workshop", "Meal", "Hacking", "Ceremony", "Other"],
    tabs: [
      { key: "schedule",      label: "Schedule",      visible: true  },
      { key: "groups",        label: "Teams",         visible: true  },
      { key: "announcements", label: "Announcements", visible: true  },
      { key: "links",         label: "Resources",     visible: true  },
    ],
  },
  {
    key: "conference",
    label: "Conference",
    emoji: "🎤",
    desc: "Multi-track sessions, speakers, and live audience updates",
    color: "#6366f1",
    font: "default",
    categories: ["Keynote", "Session", "Workshop", "Meal", "Other"],
    tabs: [
      { key: "schedule",      label: "Schedule",      visible: true  },
      { key: "announcements", label: "Updates",       visible: true  },
      { key: "links",         label: "Links",         visible: true  },
      { key: "groups",        label: "Groups",        visible: false },
    ],
  },
  {
    key: "market",
    label: "Market / Pop-up",
    emoji: "🛍️",
    desc: "Vendor lineups, set times, and links all in one place",
    color: "#f97316",
    font: "default",
    categories: ["Vendor", "Performance", "Food", "Activity", "Other"],
    tabs: [
      { key: "schedule",      label: "Schedule",      visible: true  },
      { key: "links",         label: "Links",         visible: true  },
      { key: "announcements", label: "Updates",       visible: true  },
      { key: "groups",        label: "Groups",        visible: false },
    ],
  },
  {
    key: "social",
    label: "Social",
    emoji: "🎉",
    desc: "Parties, casual gatherings, and community hangouts",
    color: "#ec4899",
    font: "default",
    categories: ["Activity", "Meal", "Game", "Free", "Other"],
    tabs: [
      { key: "schedule",      label: "Schedule",      visible: true  },
      { key: "announcements", label: "Updates",       visible: true  },
      { key: "links",         label: "Links",         visible: true  },
      { key: "groups",        label: "Groups",        visible: false },
    ],
  },
  {
    key: "custom",
    label: "Custom",
    emoji: "⚙️",
    desc: "Blank slate — you configure everything yourself",
    color: "#000000",
    font: "default",
    categories: ["Session", "Meal", "Free", "Other"],
    tabs: [
      { key: "schedule",      label: "Schedule",      visible: true },
      { key: "groups",        label: "Groups",        visible: true },
      { key: "announcements", label: "Announcements", visible: true },
      { key: "links",         label: "Links",         visible: true },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50)
}
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NewEventPage() {
  const [step, setStep]             = useState<1 | 2>(1);
  const [eventType, setEventType]   = useState<EventType | null>(null);
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

  function selectType(type: EventType) {
    setEventType(type);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventType) return;
    setLoading(true); setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/dashboard/login"); return; }

    const { data, error } = await supabase
      .from('events')
      .insert({
        organizer_id:  user.id,
        title,
        tagline,
        slug,
        access_code:   accessCode,
        primary_color: eventType.color,
        font:          eventType.font,
        theme:         'light',
        tabs:          eventType.tabs,
        event_type:    eventType.key,
      })
      .select()
      .single()

    if (error) { setError(error.message); setLoading(false); return; }

    // Invalidate dashboard cache so new event shows up immediately
    cacheClear("prelude:dashboard");
    router.push(`/dashboard/${data.id}`)
  }

  const lbl = { color: t.textSub, fontSize: "13px", fontWeight: 500 } as React.CSSProperties;

  // ── Step 1: Type selection ──────────────────────────────────────────────────
  if (step === 1) {
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
          className="mb-8"
        >
          <h1 className="text-[28px] font-semibold tracking-tight leading-none mb-1" style={{ color: t.text }}>
            What kind of event?
          </h1>
          <p className="text-[14px]" style={{ color: t.textSub }}>
            Pick a type to set up sensible defaults. You can change everything later.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {EVENT_TYPES.map((type, i) => (
            <motion.button
              key={type.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectType(type)}
              className="flex flex-col gap-3 p-5 rounded-2xl text-left group transition-all hover:opacity-80"
              style={{
                border:     `1px solid ${t.border}`,
                background: t.surface,
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px]"
                  style={{ background: type.color + "18" }}
                >
                  {type.emoji}
                </div>
                <div
                  className="w-2 h-2 rounded-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: type.color }}
                />
              </div>
              <div>
                <p className="text-[15px] font-semibold mb-1" style={{ color: t.text }}>{type.label}</p>
                <p className="text-[12px] leading-relaxed" style={{ color: t.textFaint }}>{type.desc}</p>
              </div>

              {/* Default color preview */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full" style={{ background: type.color }} />
                <span className="text-[11px] font-mono" style={{ color: t.textFaint }}>{type.color}</span>
              </div>

              {/* Visible tabs preview */}
              <div className="flex gap-1 flex-wrap">
                {type.tabs.filter(tab => tab.visible).map(tab => (
                  <span
                    key={tab.key}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: t.border, color: t.textFaint }}
                  >
                    {tab.label}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    )
  }

  // ── Step 2: Event details ───────────────────────────────────────────────────
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="px-10 py-10 max-w-xl"
    >
      {/* Back + header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="mb-8"
      >
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 text-[13px] mb-6 transition-opacity hover:opacity-60"
          style={{ color: t.textFaint }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Selected type badge */}
        {eventType && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[12px] font-medium"
            style={{ background: eventType.color + "15", color: eventType.color }}
          >
            <span>{eventType.emoji}</span>
            {eventType.label}
          </div>
        )}

        <h1 className="text-[28px] font-semibold tracking-tight leading-none mb-1" style={{ color: t.text }}>
          Name your event
        </h1>
        <p className="text-[14px]" style={{ color: t.textSub }}>
          Fill in the basics — everything else is set up for you.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col gap-1.5"
        >
          <label style={lbl}>Event name *</label>
          <input
            type="text" value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder={
              eventType?.key === "retreat"   ? "e.g. Spring Retreat 2026" :
              eventType?.key === "hackathon" ? "e.g. StonyHack 2026"      :
              eventType?.key === "conference"? "e.g. Design Summit 2026"  :
              eventType?.key === "market"    ? "e.g. Spring Pop-up Market" :
              eventType?.key === "social"    ? "e.g. End of Year Party"   :
              "e.g. My Event 2026"
            }
            required
            style={inputStyle(t)}
          />
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4 }}
          className="flex flex-col gap-1.5"
        >
          <label style={lbl}>Tagline</label>
          <input
            type="text" value={tagline}
            onChange={e => setTagline(e.target.value)}
            placeholder={
              eventType?.key === "retreat"   ? "e.g. A weekend to seek first" :
              eventType?.key === "hackathon" ? "e.g. Build. Break. Ship."     :
              eventType?.key === "conference"? "e.g. Two days of big ideas"   :
              "e.g. A day to remember"
            }
            style={inputStyle(t)}
          />
        </motion.div>

        {/* Slug */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
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
              placeholder="spring-retreat-2026" required
              className="flex-1 px-3 py-3 text-[15px] outline-none"
              style={{ background: t.inputBg, color: t.text }}
            />
          </div>
        </motion.div>

        {/* Access code */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
          className="flex flex-col gap-1.5"
        >
          <label style={lbl}>Access code *</label>
          <div className="flex gap-2">
            <input
              type="text" value={accessCode}
              onChange={e => setAccessCode(e.target.value.toUpperCase())}
              required className="font-mono"
              style={{ ...inputStyle(t), flex: 1 }}
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

        {/* Defaults preview */}
        {eventType && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.4 }}
            className="p-4 rounded-xl flex flex-col gap-3"
            style={{ background: t.surface, border: `1px solid ${t.border}` }}
          >
            <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: t.textFaint }}>
              Defaults for {eventType.label}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ background: eventType.color }} />
                <span className="text-[12px] font-mono" style={{ color: t.textSub }}>{eventType.color}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px]" style={{ color: t.textSub }}>
                  Font: <span className="font-medium" style={{ color: t.text }}>{eventType.font}</span>
                </span>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {eventType.tabs.map(tab => (
                <span
                  key={tab.key}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: tab.visible ? eventType.color + "15" : t.border,
                    color:      tab.visible ? eventType.color         : t.textFaint,
                  }}
                >
                  {tab.label}
                </span>
              ))}
            </div>
            <p className="text-[11px]" style={{ color: t.textFaint }}>
              You can change all of this in the Design section after creating.
            </p>
          </motion.div>
        )}

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
          type="submit" disabled={loading || !title.trim()}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileTap={{ scale: 0.98 }}
          className="py-3 rounded-xl text-[15px] font-medium disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
          style={btnPrimary(t)}
        >
          {loading ? "Creating..." : <>Create event <ArrowRight size={15} /></>}
        </motion.button>
      </form>
    </motion.div>
  )
}