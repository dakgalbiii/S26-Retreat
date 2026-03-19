"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";
import { useTheme, tokens, inputStyle } from "../../theme-context";
import { Trash2, MapPin, Plus, Clock, AlertCircle, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Block = {
  id: string; day: number; start_time: string; title: string;
  description: string | null; location: string | null;
  category: string | null; position: number;
}

type DayMeta = {
  day: number;
  label: string;
  date: string; // ISO date string e.g. "2026-03-13" or ""
}

const CATEGORIES = ["Session", "Meal", "Prayer", "Free", "Other"]

const HOURS = Array.from({ length: 24 }, (_, i) => i) // 0-23
const MINUTES = ["00", "15", "30", "45"]

function pad(n: number) { return String(n).padStart(2, '0') }

function formatTime(hour: number, minute: string, period: string): string {
  let h = hour;
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${pad(h)}:${minute}`
}

function toMinutes(timeStr: string): number {
  // Accepts "HH:MM" 24hr format
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatDisplayTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${pad(m)} ${period}`;
}

function formatTimeRange(start: string, end: string): string {
  return `${formatDisplayTime(start)}–${formatDisplayTime(end)}`;
}

function checkOverlap(
  newStart: string, newEnd: string,
  existingBlocks: Block[]
): Block | null {
  const ns = toMinutes(newStart);
  const ne = toMinutes(newEnd);
  for (const block of existingBlocks) {
    const parts = block.start_time.split("–");
    if (parts.length !== 2) continue;
    const bs = toMinutes(parts[0].trim());
    const be = toMinutes(parts[1].trim());
    if (ns < be && ne > bs) return block;
  }
  return null;
}

// ── Time Picker ──────────────────────────────────────────────────────────────

function TimePicker({
  label, hour, minute, period,
  onHour, onMinute, onPeriod, t,
}: {
  label: string;
  hour: number; minute: string; period: string;
  onHour: (h: number) => void;
  onMinute: (m: string) => void;
  onPeriod: (p: string) => void;
  t: ReturnType<typeof tokens>;
}) {
  const sel = {
    ...inputStyle(t),
    appearance: 'none' as const,
    width: 'auto',
    padding: '10px 12px',
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ color: t.textSub, fontSize: "13px", fontWeight: 500 }}>{label}</label>
      <div className="flex items-center gap-2">
        {/* Hour */}
        <select value={hour} onChange={e => onHour(Number(e.target.value))} style={sel}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span style={{ color: t.textFaint, fontSize: "18px", fontWeight: 300 }}>:</span>
        {/* Minute */}
        <select value={minute} onChange={e => onMinute(e.target.value)} style={sel}>
          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {/* AM/PM */}
        <select value={period} onChange={e => onPeriod(e.target.value)} style={sel}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ScheduleEditorPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [days, setDays] = useState<DayMeta[]>([{ day: 1, label: "Day 1", date: "" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [overlapError, setOverlapError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("AM");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();
  const { theme } = useTheme();
  const t = tokens(theme);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }

      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('event_id', id)
        .order('day')
        .order('position')

      if (error) { console.error(error); return; }
      setBlocks(data ?? [])

      if (data && data.length > 0) {
        const maxDay = Math.max(...data.map((b: Block) => b.day))
        setDays(Array.from({ length: maxDay }, (_, i) => ({
          day: i + 1,
          label: `Day ${i + 1}`,
          date: "",
        })))
      }

      setLoading(false)
    }
    load()
  }, [])

  function updateDayMeta(dayNum: number, field: 'label' | 'date', value: string) {
    setDays(prev => prev.map(d => d.day === dayNum ? { ...d, [field]: value } : d))
  }

  function addDay() {
    const next = days.length + 1;
    setDays(prev => [...prev, { day: next, label: `Day ${next}`, date: "" }])
    setActiveDay(next)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return
    if (!activeDayMeta?.date) {
      setOverlapError("Please set a date for this day before adding blocks.")
      return
    }

    const startStr = formatTime(startHour, startMinute, startPeriod)
    const endStr = formatTime(endHour, endMinute, endPeriod)

    // Validate end > start
    if (toMinutes(endStr) <= toMinutes(startStr)) {
      setOverlapError("End time must be after start time.")
      return
    }

    // Check overlap
    const dayBlocks = blocks.filter(b => b.day === activeDay)
    const conflict = checkOverlap(startStr, endStr, dayBlocks)
    if (conflict) {
      setOverlapError(`Overlaps with "${conflict.title}" (${conflict.start_time})`)
      return
    }

    setSaving(true)
    const timeStr = formatTimeRange(startStr, endStr)

    const { data, error } = await supabase
      .from('schedule_blocks')
      .insert({
        event_id: id, day: activeDay, start_time: timeStr, title,
        description: description || null, location: location || null,
        category: category || null,
        position: dayBlocks.length,
      })
      .select().single()

    if (error) { console.error(error); setSaving(false); return; }
    setBlocks(prev => [...prev, data])
    setTitle(""); setDescription(""); setLocation(""); setCategory("");
    setOverlapError(null)
    setSaving(false)
  }

  async function handleDelete(blockId: string) {
    await supabase.from('schedule_blocks').delete().eq('id', blockId)
    setBlocks(prev => prev.filter(b => b.id !== blockId))
  }

  const activeDayMeta = days.find(d => d.day === activeDay)
  const dayBlocks = blocks
    .filter(b => b.day === activeDay)
    .sort((a, b) => toMinutes(a.start_time.split("–")[0] ?? "00:00") - toMinutes(b.start_time.split("–")[0] ?? "00:00"))

  const lbl = { color: t.textSub, fontSize: "13px", fontWeight: 500 } as React.CSSProperties

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ color: t.textSub }}>
      Loading...
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="px-12 py-12 max-w-3xl"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="text-[32px] font-semibold tracking-tight mb-1" style={{ color: t.text }}>
          Schedule
        </h1>
        <p className="text-[15px]" style={{ color: t.textSub }}>
          {blocks.length} blocks across {days.length} day{days.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {/* Day tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex gap-2 mb-6 flex-wrap"
      >
        {days.map((day) => (
          <button
            key={day.day}
            onClick={() => { setActiveDay(day.day); setOverlapError(null); }}
            className="px-5 py-2.5 rounded-xl text-[14px] font-medium transition-all"
            style={{
              background: activeDay === day.day ? t.btnBg : t.surface,
              color: activeDay === day.day ? t.btnText : t.textSub,
              border: `1px solid ${activeDay === day.day ? 'transparent' : t.border}`,
            }}
          >
            {day.label || `Day ${day.day}`}
            {day.date && (
              <span className="ml-2 text-[11px] opacity-60">
                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={addDay}
          className="px-5 py-2.5 rounded-xl text-[14px] transition-all"
          style={{ border: `1px dashed ${t.border}`, color: t.textFaint }}
        >
          + Add day
        </button>
      </motion.div>

      {/* Day meta editor */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex gap-3 mb-8"
      >
        <div className="flex flex-col gap-1.5 flex-1">
          <label style={lbl}>Day label</label>
          <input
            type="text"
            value={activeDayMeta?.label ?? ""}
            onChange={e => updateDayMeta(activeDay, 'label', e.target.value)}
            placeholder={`Day ${activeDay}`}
            style={inputStyle(t)}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label style={lbl}>Date (optional)</label>
          <input
            type="date"
            value={activeDayMeta?.date ?? ""}
            onChange={e => updateDayMeta(activeDay, 'date', e.target.value)}
            required
            style={{ ...inputStyle(t), colorScheme: theme === 'dark' ? 'dark' : 'light' }}
          />
        </div>
      </motion.div>

      {/* Add form */}
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        onSubmit={handleAdd}
        className="flex flex-col gap-5 mb-8 p-6 rounded-2xl"
        style={{ background: t.surface, border: `1px solid ${t.border}` }}
      >
        <p className="text-[15px] font-medium" style={{ color: t.text }}>
          Add to {activeDayMeta?.label || `Day ${activeDay}`}
          {activeDayMeta?.date && (
            <span className="ml-2 text-[13px] font-normal" style={{ color: t.textSub }}>
              · {new Date(activeDayMeta.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </p>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label style={lbl}>Title *</label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Morning Prayer" required style={inputStyle(t)}
          />
        </div>

        {/* Time pickers */}
        <div
          className="p-4 rounded-xl flex flex-col gap-4"
          style={{ background: t.inputBg, border: `1px solid ${t.border}` }}
        >
          <div className="flex gap-8 flex-wrap">
            <TimePicker
              label="Start time"
              hour={startHour} minute={startMinute} period={startPeriod}
              onHour={setStartHour} onMinute={setStartMinute} onPeriod={setStartPeriod}
              t={t}
            />
            <TimePicker
              label="End time"
              hour={endHour} minute={endMinute} period={endPeriod}
              onHour={setEndHour} onMinute={setEndMinute} onPeriod={setEndPeriod}
              t={t}
            />
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2">
            <Clock size={13} style={{ color: t.textFaint }} />
            <span className="text-[13px] font-mono" style={{ color: t.textSub }}>
              {formatTimeRange(
                formatTime(startHour, startMinute, startPeriod),
                formatTime(endHour, endMinute, endPeriod)
              )}
            </span>
          </div>
        </div>

        {/* Overlap error */}
        <AnimatePresence>
          {overlapError && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
              <p className="text-[13px]" style={{ color: "#ef4444" }}>{overlapError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description + Location */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={lbl}>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional note" style={inputStyle(t)} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={lbl}>Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Main Hall" style={inputStyle(t)} />
          </div>
        </div>

        {/* Category + Submit */}
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={lbl}>Category</label>
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="rounded-xl outline-none"
              style={{ ...inputStyle(t), appearance: 'none' }}
            >
              <option value="">None</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <motion.button
            type="submit"
            disabled={saving || !title}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-medium disabled:opacity-40 shrink-0"
            style={{ background: t.btnBg, color: t.btnText }}
          >
            <Plus size={15} />
            {saving ? "Adding..." : "Add block"}
          </motion.button>
        </div>
      </motion.form>

      {/* Blocks list */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {dayBlocks.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[15px] text-center py-16"
              style={{ color: t.textFaint }}
            >
              No blocks for {activeDayMeta?.label || `Day ${activeDay}`} yet
            </motion.p>
          ) : dayBlocks.map((block, i) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start justify-between px-5 py-4 rounded-2xl gap-4"
              style={{ border: `1px solid ${t.border}` }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-[15px] font-medium" style={{ color: t.text }}>{block.title}</p>
                  {block.category && (
                    <span
                      className="text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ background: t.bg, color: t.textFaint, border: `1px solid ${t.border}` }}
                    >
                      {block.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Clock size={11} style={{ color: t.textFaint }} />
                  <p className="text-[13px] font-mono" style={{ color: t.textSub }}>{block.start_time}</p>
                </div>
                {block.description && (
                  <p className="text-[13px] mt-1" style={{ color: t.textFaint }}>{block.description}</p>
                )}
                {block.location && (
                  <p className="text-[13px] mt-1 flex items-center gap-1.5" style={{ color: t.textFaint }}>
                    <MapPin size={11} /> {block.location}
                  </p>
                )}
              </div>
              <motion.button
                onClick={() => handleDelete(block.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="shrink-0 p-2 rounded-lg transition-colors"
                style={{ color: t.textFaint }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}
              >
                <Trash2 size={15} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}