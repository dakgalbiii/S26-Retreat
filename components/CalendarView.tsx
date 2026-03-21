"use client";

import { useRef, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Check, Clock, AlertCircle } from "lucide-react";
import { tokens, inputStyle } from "@/lib/theme/theme-context";

// ── Types ─────────────────────────────────────────────────────────────────────
type Block = {
    id: string; day: number; start_time: string; title: string;
    description: string | null; location: string | null;
    category: string | null; position: number;
}
type DayMeta = { day: number; label: string; date: string; }

interface CalendarViewProps {
    eventId: string;
    blocks: Block[];
    days: DayMeta[];
    theme: string;
    onBlocksChange: (blocks: Block[]) => void;
    onDaysChange: (days: DayMeta[]) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const HOUR_HEIGHT = 80
const START_HOUR = 6
const END_HOUR = 24
const SNAP_MINUTES = 15
const TOTAL_HOURS = END_HOUR - START_HOUR
const CATEGORIES = ["Session", "Meal", "Prayer", "Free", "Other"]

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0") }

function parseBlockTimes(start_time: string): { startMin: number; endMin: number } | null {
  // Normalize dashes
  const normalized = start_time.replace(/[—-]/g, "–").trim();
  const parts = normalized.split("–");
  if (parts.length !== 2) return null;

  const parsePart = (s: string): number | null => {
    s = s.trim();

    // 24-hour: "09:00", "14:30"
    const match24 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) return parseInt(match24[1]) * 60 + parseInt(match24[2]);

    // 12-hour with period: "9:00 AM", "9:00AM", "9:00am", "10:30pm"
    const match12 = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (match12) {
      let h = parseInt(match12[1]);
      const m = match12[2] ? parseInt(match12[2]) : 0;
      const p = match12[3].toLowerCase();
      if (p === "pm" && h !== 12) h += 12;
      if (p === "am" && h === 12) h = 0;
      return h * 60 + m;
    }

    return null;
  };

  let startStr = parts[0].trim();
  let endStr   = parts[1].trim();

  // If start has no AM/PM but end does, inherit the period from end
  // e.g. "3:00–6:00pm" → start="3:00", end="6:00pm"
  const hasPeriod = (s: string) => /am|pm/i.test(s);
  if (!hasPeriod(startStr) && hasPeriod(endStr)) {
    const endPeriod = endStr.match(/(am|pm)/i)?.[1] ?? "";
    // Only inherit if start hour <= end hour numerically
    const startHour = parseInt(startStr.split(":")[0]);
    const endHour   = parseInt(endStr.split(":")[0]);
    // If start hour > end hour (e.g. 11pm–12am), don't inherit
    if (startHour <= endHour || endStr.toLowerCase().includes("am")) {
      startStr = startStr + endPeriod;
    } else {
      // Start is PM, end crossed midnight to AM
      startStr = startStr + "pm";
    }
  }

  const s = parsePart(startStr);
  const e = parsePart(endStr);
  if (s === null || e === null) return null;

  // Handle overnight blocks (e.g. 11:00pm–12:00am = 1380–1440)
  let endMin = e;
  if (endMin <= s) endMin += 24 * 60;

  return { startMin: s, endMin };
}

function minutesToDisplay(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const period = h >= 12 ? "PM" : "AM";
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${pad(m)} ${period}`;
}

function buildStartTime(startMin: number, endMin: number): string {
    return `${minutesToDisplay(startMin)}–${minutesToDisplay(endMin)}`;
}

function snapToGrid(min: number): number {
    return Math.round(min / SNAP_MINUTES) * SNAP_MINUTES;
}

function checkOverlapExcluding(id: string, startMin: number, endMin: number, dayBlocks: Block[]): boolean {
    return dayBlocks.some(b => {
        if (b.id === id) return false;
        const times = parseBlockTimes(b.start_time);
        if (!times) return false;
        return startMin < times.endMin && endMin > times.startMin;
    });
}

function minutesToTop(min: number): number {
    return ((min - START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

function topToMinutes(px: number): number {
    return (px / HOUR_HEIGHT) * 60 + START_HOUR * 60;
}

// ── HSL color system ──────────────────────────────────────────────────────────
const CATEGORY_HUES: Record<string, number> = {
    Session: 215, Meal: 28, Prayer: 262, Free: 152, Other: 220, "": 220,
}

function getCategoryColor(category: string | null, isDark: boolean) {
    const hue = CATEGORY_HUES[category ?? ""] ?? 220;
    return isDark
        ? { bg: `hsla(${hue},25%,26%,1)`, border: `hsla(${hue},30%,42%,0.8)`, text: `hsl(${hue},40%,78%)` }
        : { bg: `hsla(${hue},40%,94%,1)`, border: `hsla(${hue},30%,76%,1)`, text: `hsl(${hue},35%,32%)` }
}

// ── Debounce helper ───────────────────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// ── Calendar Block ────────────────────────────────────────────────────────────
function CalBlock({ block, isDark, onDragMove, onResizeMove, onDragEnd, onResizeEnd, onClick, t }: {
    block: Block; isDark: boolean;
    onDragMove: (id: string, dy: number) => void;
    onResizeMove: (id: string, dy: number) => void;
    onDragEnd: (id: string) => void;
    onResizeEnd: (id: string) => void;
    onClick: (block: Block) => void;
    t: ReturnType<typeof tokens>;
}) {
    const times = parseBlockTimes(block.start_time);
    if (!times) return null;

    const { startMin, endMin } = times;
    const top = minutesToTop(startMin);
    const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, HOUR_HEIGHT / 2);
    const { bg, border, text } = getCategoryColor(block.category, isDark);

    const dragStartY = useRef(0);
    const resizeStartY = useRef(0);
    const didDrag = useRef(false);

    function onMouseDownDrag(e: React.MouseEvent) {
        e.stopPropagation();
        dragStartY.current = e.clientY;
        didDrag.current = false;

        function onMove(e: MouseEvent) {
            const dy = e.clientY - dragStartY.current;
            if (Math.abs(dy) > 3) didDrag.current = true;
            onDragMove(block.id, dy);
        }
        function onUp() {
            onDragEnd(block.id);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        }
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    function onMouseDownResize(e: React.MouseEvent) {
        e.stopPropagation();
        resizeStartY.current = e.clientY;

        function onMove(e: MouseEvent) {
            onResizeMove(block.id, e.clientY - resizeStartY.current);
        }
        function onUp() {
            onResizeEnd(block.id);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        }
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    const showTime = height >= HOUR_HEIGHT * 0.75;

    return (
        <div
            className="absolute left-1 right-1 rounded-lg overflow-hidden select-none group"
            style={{ top: `${top}px`, height: `${height}px`, background: bg, border: `1.5px solid ${border}`, cursor: "grab", zIndex: 2 }}
            onMouseDown={onMouseDownDrag}
            onClick={() => { if (!didDrag.current) onClick(block); }}
        >
            <div className="px-2 pt-1 pb-4 h-full overflow-hidden flex flex-col gap-0.5">
                <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: text }}>
                    {block.title}
                </p>
                {showTime && (
                    <p className="text-[9px] truncate" style={{ color: text, opacity: 0.65 }}>
                        {minutesToDisplay(startMin)} – {minutesToDisplay(endMin)}
                    </p>
                )}
                {showTime && block.location && (
                    <p className="text-[9px] truncate" style={{ color: text, opacity: 0.5 }}>
                        {block.location}
                    </p>
                )}
            </div>

            {/* Resize handle */}
            <div
                className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                style={{ background: `${border}66` }}
                onMouseDown={onMouseDownResize}
                onClick={e => e.stopPropagation()}
            >
                <div className="w-8 h-0.5 rounded-full" style={{ background: border }} />
            </div>
        </div>
    );
}

// ── Main CalendarView ─────────────────────────────────────────────────────────
export default function CalendarView({ eventId, blocks, days, theme, onBlocksChange, onDaysChange }: CalendarViewProps) {
    const t = tokens(theme as any);
    const isDark = theme === "dark";
    const supabase = createClient();

    // Drag-move / resize offsets
    const [dragOffsets, setDragOffsets] = useState<Record<string, number>>({});
    const [resizeOffsets, setResizeOffsets] = useState<Record<string, number>>({});

    // Drag-to-create selection
    const [dragSelect, setDragSelect] = useState<{
        day: number; startMin: number; endMin: number;
    } | null>(null);

    // Add modal
    const [modal, setModal] = useState<{ day: number; startMin: number } | null>(null);
    const [modalTitle, setModalTitle] = useState("");
    const [modalDesc, setModalDesc] = useState("");
    const [modalLoc, setModalLoc] = useState("");
    const [modalCat, setModalCat] = useState("");
    const [modalEndMin, setModalEndMin] = useState(0);
    const [modalError, setModalError] = useState("");
    const [savingModal, setSavingModal] = useState(false);

    // Edit modal
    const [editBlock, setEditBlock] = useState<Block | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editLoc, setEditLoc] = useState("");
    const [editCat, setEditCat] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    const gridRef = useRef<HTMLDivElement>(null);

    // ── Persist day_meta (debounced) ────────────────────────────────────────────
    const persistDays = useRef(
        debounce((days: DayMeta[], eventId: string) => {
            createClient().from("events").update({ day_meta: days }).eq("id", eventId).then(() => { });
        }, 800)
    ).current;

    useEffect(() => {
        if (days.length === 0) return;
        persistDays(days, eventId);
    }, [days]);

    // ── Drag-to-create ──────────────────────────────────────────────────────────
    function handleGridMouseDown(e: React.MouseEvent, dayNum: number) {
        if ((e.target as HTMLElement).closest(".cal-block")) return;
        e.preventDefault();

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const startMin = snapToGrid(topToMinutes(e.clientY - rect.top));

        setDragSelect({ day: dayNum, startMin, endMin: startMin + SNAP_MINUTES });

        function onMove(mv: MouseEvent) {
            const rawMin = topToMinutes(mv.clientY - rect.top);
            const snapped = snapToGrid(Math.max(rawMin, startMin + SNAP_MINUTES));
            setDragSelect({ day: dayNum, startMin, endMin: Math.min(snapped, END_HOUR * 60) });
        }

        function onUp() {
            setDragSelect(prev => {
                if (!prev) return null;
                setModal({ day: prev.day, startMin: prev.startMin });
                setModalEndMin(prev.endMin);
                setModalTitle(""); setModalDesc(""); setModalLoc(""); setModalCat(""); setModalError("");
                return null;
            });
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        }

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    // ── Add block ───────────────────────────────────────────────────────────────
    async function handleAddBlock() {
        if (!modal || !modalTitle.trim()) return;
        setModalError("");
        if (modalEndMin <= modal.startMin) { setModalError("End must be after start"); return; }
        const dayBlocks = blocks.filter(b => b.day === modal.day);
        if (checkOverlapExcluding("__new__", modal.startMin, modalEndMin, dayBlocks)) {
            setModalError("Overlaps with another block"); return;
        }
        setSavingModal(true);
        const start_time = buildStartTime(modal.startMin, modalEndMin);
        const { data, error } = await supabase.from("schedule_blocks").insert({
            event_id: eventId, day: modal.day, start_time,
            title: modalTitle.trim(), description: modalDesc || null,
            location: modalLoc || null, category: modalCat || null,
            position: dayBlocks.length,
        }).select().single();
        if (error) { setModalError(error.message); setSavingModal(false); return; }
        onBlocksChange([...blocks, data]);
        setModal(null); setSavingModal(false);
    }

    // ── Edit block ──────────────────────────────────────────────────────────────
    function openEdit(block: Block) {
        setEditBlock(block);
        setEditTitle(block.title);
        setEditDesc(block.description ?? "");
        setEditLoc(block.location ?? "");
        setEditCat(block.category ?? "");
    }

    async function handleSaveEdit() {
        if (!editBlock) return;
        setSavingEdit(true);
        const { error } = await supabase.from("schedule_blocks").update({
            title: editTitle, description: editDesc || null,
            location: editLoc || null, category: editCat || null,
        }).eq("id", editBlock.id);
        if (error) { console.error(error); setSavingEdit(false); return; }
        onBlocksChange(blocks.map(b => b.id === editBlock.id
            ? { ...b, title: editTitle, description: editDesc || null, location: editLoc || null, category: editCat || null }
            : b
        ));
        setEditBlock(null); setSavingEdit(false);
    }

    async function handleDeleteFromEdit() {
        if (!editBlock) return;
        await supabase.from("schedule_blocks").delete().eq("id", editBlock.id);
        onBlocksChange(blocks.filter(b => b.id !== editBlock.id));
        setEditBlock(null);
    }

    // ── Block drag ──────────────────────────────────────────────────────────────
    function onDragMove(id: string, dy: number) {
        setDragOffsets(prev => ({ ...prev, [id]: dy }));
    }

    async function onDragEnd(id: string) {
        const dy = dragOffsets[id] ?? 0;
        const block = blocks.find(b => b.id === id);
        if (!block) return;
        const times = parseBlockTimes(block.start_time);
        if (!times) return;
        const { startMin, endMin } = times;
        const duration = endMin - startMin;
        const deltaMin = snapToGrid((dy / HOUR_HEIGHT) * 60);
        const newStart = Math.max(START_HOUR * 60, Math.min(startMin + deltaMin, END_HOUR * 60 - duration));
        const newEnd = newStart + duration;
        const dayBlocks = blocks.filter(b => b.day === block.day);
        if (!checkOverlapExcluding(id, newStart, newEnd, dayBlocks)) {
            const start_time = buildStartTime(newStart, newEnd);
            await supabase.from("schedule_blocks").update({ start_time }).eq("id", id);
            onBlocksChange(blocks.map(b => b.id === id ? { ...b, start_time } : b));
        }
        setDragOffsets(prev => { const n = { ...prev }; delete n[id]; return n; });
    }

    // ── Block resize ────────────────────────────────────────────────────────────
    function onResizeMove(id: string, dy: number) {
        setResizeOffsets(prev => ({ ...prev, [id]: dy }));
    }

    async function onResizeEnd(id: string) {
        const dy = resizeOffsets[id] ?? 0;
        const block = blocks.find(b => b.id === id);
        if (!block) return;
        const times = parseBlockTimes(block.start_time);
        if (!times) return;
        const { startMin, endMin } = times;
        const deltaMin = snapToGrid((dy / HOUR_HEIGHT) * 60);
        const newEnd = Math.max(startMin + SNAP_MINUTES, Math.min(endMin + deltaMin, END_HOUR * 60));
        const dayBlocks = blocks.filter(b => b.day === block.day);
        if (!checkOverlapExcluding(id, startMin, newEnd, dayBlocks)) {
            const start_time = buildStartTime(startMin, newEnd);
            await supabase.from("schedule_blocks").update({ start_time }).eq("id", id);
            onBlocksChange(blocks.map(b => b.id === id ? { ...b, start_time } : b));
        }
        setResizeOffsets(prev => { const n = { ...prev }; delete n[id]; return n; });
    }

    // ── Visual block (with drag offset applied) ─────────────────────────────────
    function getVisualBlock(block: Block): Block {
        const dy = dragOffsets[block.id] ?? 0;
        const rdy = resizeOffsets[block.id] ?? 0;
        if (dy === 0 && rdy === 0) return block;
        const times = parseBlockTimes(block.start_time);
        if (!times) return block;
        const { startMin, endMin } = times;
        const duration = endMin - startMin;
        const newStart = Math.max(START_HOUR * 60, startMin + (dy / HOUR_HEIGHT) * 60);
        const newEnd = rdy !== 0
            ? Math.max(newStart + SNAP_MINUTES, endMin + (rdy / HOUR_HEIGHT) * 60)
            : newStart + duration;
        return { ...block, start_time: buildStartTime(newStart, newEnd) };
    }

    // ── Day meta ────────────────────────────────────────────────────────────────
    function addDay() {
        const next = days.length + 1;
        onDaysChange([...days, { day: next, label: `Day ${next}`, date: "" }]);
    }

    function updateDayMeta(dayNum: number, field: "label" | "date", value: string) {
        onDaysChange(days.map(d => d.day === dayNum ? { ...d, [field]: value } : d));
    }

    const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

    const hourLineColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";
    const halfHourColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)";
    const timeLabelColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.28)";
    const selectionBg = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)";
    const selectionBorder = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)";

    return (
        <div className="flex flex-col gap-4">

            {/* ── Day controls ── */}
            <div className="flex gap-2 flex-wrap items-end">
                {days.map(day => (
                    <div key={day.day} className="flex gap-1.5">
                        <input
                            type="text" value={day.label}
                            onChange={e => updateDayMeta(day.day, "label", e.target.value)}
                            className="px-2 py-1.5 rounded-lg text-[12px] outline-none w-20"
                            style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.text }}
                        />
                        <input
                            type="date" value={day.date}
                            onChange={e => updateDayMeta(day.day, "date", e.target.value)}
                            className="px-2 py-1.5 rounded-lg text-[12px] outline-none"
                            style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.text, colorScheme: isDark ? "dark" : "light" }}
                        />
                    </div>
                ))}
                <button
                    onClick={addDay}
                    className="px-3 py-1.5 rounded-lg text-[12px] transition-opacity hover:opacity-70"
                    style={{ border: `1px dashed ${t.border}`, color: t.textFaint }}
                >
                    + Add day
                </button>
            </div>

            {/* ── Grid ── */}
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
                <div ref={gridRef} className="flex" style={{ width: "100%" }}>

                    {/* Time axis */}
                    <div className="shrink-0 w-12" style={{ borderRight: `1px solid ${t.border}` }}>
                        <div className="h-10" style={{ borderBottom: `1px solid ${t.border}` }} />
                        <div className="relative" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
                            {hours.map(h => (
                                <div key={h} className="absolute w-full flex justify-end pr-2"
                                    style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                                    <span className="text-[10px] -mt-2" style={{ color: timeLabelColor }}>
                                        {h === 24 ? "12am" : h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Day columns */}
                    {days.map((day, di) => {
                        const dayBlocks = blocks.filter(b => b.day === day.day);
                        const sel = dragSelect?.day === day.day ? dragSelect : null;
                        return (
                            <div key={day.day} className="flex-1 flex flex-col min-w-0"
                                style={{ borderRight: di < days.length - 1 ? `1px solid ${t.border}` : "none" }}>

                                {/* Day header */}
                                <div className="h-10 flex flex-col items-center justify-center px-2"
                                    style={{ borderBottom: `1px solid ${t.border}`, background: t.surface }}>
                                    <p className="text-[11px] font-semibold truncate" style={{ color: t.text }}>{day.label}</p>
                                    {day.date && (
                                        <p className="text-[9px]" style={{ color: t.textFaint }}>
                                            {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </p>
                                    )}
                                </div>

                                {/* Grid body */}
                                <div
                                    className="relative select-none"
                                    style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px`, background: t.bg, cursor: "crosshair" }}
                                    onMouseDown={e => handleGridMouseDown(e, day.day)}
                                >
                                    {/* Hour lines */}
                                    {hours.map(h => (
                                        <div key={h} className="absolute left-0 right-0 pointer-events-none"
                                            style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px`, borderTop: `1px solid ${hourLineColor}` }} />
                                    ))}

                                    {/* Half-hour lines */}
                                    {hours.slice(0, -1).map(h => (
                                        <div key={`${h}.5`} className="absolute left-0 right-0 pointer-events-none"
                                            style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px`, borderTop: `1px dashed ${halfHourColor}` }} />
                                    ))}

                                    {/* Drag-to-create selection */}
                                    {sel && (
                                        <div
                                            className="absolute left-1 right-1 rounded-lg pointer-events-none"
                                            style={{
                                                top: `${minutesToTop(sel.startMin)}px`,
                                                height: `${minutesToTop(sel.endMin) - minutesToTop(sel.startMin)}px`,
                                                background: selectionBg,
                                                border: `1.5px solid ${selectionBorder}`,
                                                zIndex: 1,
                                            }}
                                        >
                                            <div className="px-2 py-1 flex flex-col gap-0.5">
                                                <span className="text-[10px] font-medium" style={{ color: timeLabelColor }}>
                                                    {minutesToDisplay(sel.startMin)}
                                                </span>
                                                {sel.endMin - sel.startMin >= 30 && (
                                                    <span className="text-[9px]" style={{ color: timeLabelColor, opacity: 0.7 }}>
                                                        → {minutesToDisplay(sel.endMin)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Blocks */}
                                    {dayBlocks.map(block => (
                                        <div key={block.id} className="cal-block">
                                            <CalBlock
                                                block={getVisualBlock(block)}
                                                isDark={isDark}
                                                onDragMove={onDragMove}
                                                onResizeMove={onResizeMove}
                                                onDragEnd={onDragEnd}
                                                onResizeEnd={onResizeEnd}
                                                onClick={openEdit}
                                                t={t}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="text-[11px]" style={{ color: t.textFaint }}>
                Drag to select a time range · Click a block to edit · Drag block to move · Drag bottom edge to resize
            </p>

            {/* ── Add modal ── */}
            <AnimatePresence>
                {modal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: "rgba(0,0,0,0.45)" }}
                        onClick={() => setModal(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
                            style={{ background: isDark ? "#1c1c1c" : "#fff", border: `1px solid ${t.border}` }}
                            onClick={e => e.stopPropagation()}>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[15px] font-semibold" style={{ color: t.text }}>New block</p>
                                    <p className="text-[12px] font-mono mt-0.5" style={{ color: t.textFaint }}>
                                        {minutesToDisplay(modal.startMin)} → {minutesToDisplay(modalEndMin)}
                                    </p>
                                </div>
                                <button onClick={() => setModal(null)} style={{ color: t.textFaint }}><X size={16} /></button>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-medium" style={{ color: t.textSub }}>Title *</label>
                                <input type="text" value={modalTitle} onChange={e => setModalTitle(e.target.value)}
                                    placeholder="e.g. Opening Keynote" autoFocus
                                    onKeyDown={e => e.key === "Enter" && handleAddBlock()}
                                    style={inputStyle(t)} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-medium" style={{ color: t.textSub }}>End time</label>
                                <div className="flex items-center gap-2">
                                    <Clock size={13} style={{ color: t.textFaint }} />
                                    <span className="text-[13px] font-mono" style={{ color: t.textSub }}>
                                        {minutesToDisplay(modal.startMin)} →
                                    </span>
                                    <select value={modalEndMin} onChange={e => setModalEndMin(Number(e.target.value))}
                                        className="rounded-lg outline-none text-[13px]"
                                        style={{ ...inputStyle(t), width: "auto", padding: "6px 10px" }}>
                                        {Array.from({ length: (END_HOUR * 60 - modal.startMin) / SNAP_MINUTES }, (_, i) => {
                                            const val = modal.startMin + (i + 1) * SNAP_MINUTES;
                                            return <option key={val} value={val}>{minutesToDisplay(val)}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[12px] font-medium" style={{ color: t.textSub }}>Description</label>
                                    <input type="text" value={modalDesc} onChange={e => setModalDesc(e.target.value)}
                                        placeholder="Optional" style={inputStyle(t)} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[12px] font-medium" style={{ color: t.textSub }}>Location</label>
                                    <input type="text" value={modalLoc} onChange={e => setModalLoc(e.target.value)}
                                        placeholder="e.g. Main Hall" style={inputStyle(t)} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-medium" style={{ color: t.textSub }}>Category</label>
                                <select value={modalCat} onChange={e => setModalCat(e.target.value)}
                                    style={{ ...inputStyle(t), appearance: "none" }}>
                                    <option value="">None</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <AnimatePresence>
                                {modalError && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                        <AlertCircle size={13} style={{ color: "#ef4444" }} />
                                        <p className="text-[12px]" style={{ color: "#ef4444" }}>{modalError}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddBlock}
                                disabled={savingModal || !modalTitle.trim()}
                                className="w-full py-2.5 rounded-xl text-[14px] font-medium disabled:opacity-40"
                                style={{ background: t.btnBg, color: t.btnText }}>
                                {savingModal ? "Adding..." : "Add block"}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Edit modal ── */}
            <AnimatePresence>
                {editBlock && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: "rgba(0,0,0,0.45)" }}
                        onClick={() => setEditBlock(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
                            style={{ background: isDark ? "#1c1c1c" : "#fff", border: `1px solid ${t.border}` }}
                            onClick={e => e.stopPropagation()}>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[15px] font-semibold" style={{ color: t.text }}>Edit block</p>
                                    <p className="text-[12px] font-mono mt-0.5" style={{ color: t.textFaint }}>
                                        {(() => {
                                            const t = parseBlockTimes(editBlock.start_time);
                                            return t ? `${minutesToDisplay(t.startMin)} – ${minutesToDisplay(t.endMin)}` : editBlock.start_time;
                                        })()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleDeleteFromEdit} className="p-1.5 rounded-lg"
                                        style={{ color: t.textFaint }}
                                        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                                        onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}>
                                        <Trash2 size={15} />
                                    </button>
                                    <button onClick={() => setEditBlock(null)} style={{ color: t.textFaint }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-medium" style={{ color: t.textSub }}>Title</label>
                                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                    style={inputStyle(t)} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[12px] font-medium" style={{ color: t.textSub }}>Description</label>
                                    <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)}
                                        placeholder="Optional" style={inputStyle(t)} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[12px] font-medium" style={{ color: t.textSub }}>Location</label>
                                    <input type="text" value={editLoc} onChange={e => setEditLoc(e.target.value)}
                                        placeholder="e.g. Main Hall" style={inputStyle(t)} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-medium" style={{ color: t.textSub }}>Category</label>
                                <select value={editCat} onChange={e => setEditCat(e.target.value)}
                                    style={{ ...inputStyle(t), appearance: "none" }}>
                                    <option value="">None</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveEdit} disabled={savingEdit}
                                className="w-full py-2.5 rounded-xl text-[14px] font-medium disabled:opacity-40 flex items-center justify-center gap-2"
                                style={{ background: t.btnBg, color: t.btnText }}>
                                {savingEdit ? "Saving..." : <><Check size={14} /> Save changes</>}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}