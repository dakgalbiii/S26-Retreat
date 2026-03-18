"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";

type Block = {
  id: string;
  day: number;
  start_time: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string | null;
  position: number;
}

const CATEGORIES = ["Session", "Meal", "Prayer", "Free", "Other"]
const DAY_LABELS: Record<number, string> = { 1: "Day 1", 2: "Day 2", 3: "Day 3", 4: "Day 4" }

export default function ScheduleEditorPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [numDays, setNumDays] = useState(1);

  // Form state
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();

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

      // Detect how many days exist
      if (data && data.length > 0) {
        const max = Math.max(...data.map((b: Block) => b.day))
        setNumDays(max)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !startTime) return
    setSaving(true)

    const dayBlocks = blocks.filter((b) => b.day === activeDay)

    const { data, error } = await supabase
      .from('schedule_blocks')
      .insert({
        event_id: id,
        day: activeDay,
        start_time: startTime,
        title,
        description: description || null,
        location: location || null,
        category: category || null,
        position: dayBlocks.length,
      })
      .select()
      .single()

    if (error) { console.error(error); setSaving(false); return; }
    setBlocks([...blocks, data])
    setTitle("")
    setStartTime("")
    setDescription("")
    setLocation("")
    setCategory("")
    setSaving(false)
  }

  async function handleDelete(blockId: string) {
    await supabase.from('schedule_blocks').delete().eq('id', blockId)
    setBlocks(blocks.filter((b) => b.id !== blockId))
  }

  function addDay() {
    setNumDays(numDays + 1)
    setActiveDay(numDays + 1)
  }

  const dayBlocks = blocks.filter((b) => b.day === activeDay)

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-sm text-brown/40">
      Loading...
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/dashboard/${id}`)}
          className="text-xs text-brown/30 hover:text-brown/60 transition-colors mb-6 block"
        >
          ← Back
        </button>
        <p className="text-[10px] tracking-widest uppercase text-brown/30 mb-1">
          Editor
        </p>
        <h1 className="text-[32px] font-medium tracking-tight text-brown leading-none">
          Schedule
        </h1>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {Array.from({ length: numDays }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              background: activeDay === day ? "#2c1a0e" : "transparent",
              color: activeDay === day ? "#f2ede4" : "rgba(44,26,14,0.4)",
              border: activeDay === day ? "none" : "1px solid rgba(44,26,14,0.15)"
            }}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
        <button
          onClick={addDay}
          className="px-4 py-2 rounded-lg text-sm text-brown/30 border border-dashed border-brown/15 hover:border-brown/30 hover:text-brown/50 transition-all"
        >
          + Add day
        </button>
      </div>

      {/* Add block form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-8 border border-brown/10 rounded-xl p-5">
        <p className="text-[11px] uppercase tracking-widest text-brown/40 mb-1">
          Add block to {DAY_LABELS[activeDay]}
        </p>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[11px] uppercase tracking-widest text-brown/40">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Prayer"
              required
              className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25"
            />
          </div>
          <div className="flex flex-col gap-1 w-36">
            <label className="text-[11px] uppercase tracking-widest text-brown/40">
              Time *
            </label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="9:00-10:00am"
              required
              className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[11px] uppercase tracking-widest text-brown/40">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional subtitle"
              className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[11px] uppercase tracking-widest text-brown/40">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Hall"
              className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest text-brown/40">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown"
          >
            <option value="">None</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving || !title || !startTime}
          className="w-full py-2.5 bg-brown text-paper text-sm font-medium rounded-lg hover:bg-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Adding..." : `Add to ${DAY_LABELS[activeDay]}`}
        </button>
      </form>

      {/* Blocks list */}
      <div className="flex flex-col gap-2">
        {dayBlocks.length === 0 && (
          <p className="text-sm text-brown/30 text-center py-10">
            No blocks for {DAY_LABELS[activeDay]} yet.
          </p>
        )}
        {dayBlocks.map((block) => (
          <div
            key={block.id}
            className="flex items-start justify-between border border-brown/10 rounded-xl px-4 py-3 gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-brown">{block.title}</p>
                {block.category && (
                  <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-brown/8 text-brown/40">
                    {block.category}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-brown/40 mt-0.5">{block.start_time}</p>
              {block.description && (
                <p className="text-[11px] text-brown/30 mt-0.5">{block.description}</p>
              )}
              {block.location && (
                <p className="text-[11px] text-brown/30 mt-0.5">📍 {block.location}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(block.id)}
              className="shrink-0 text-xs text-brown/25 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}