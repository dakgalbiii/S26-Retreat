"use client";

import { useState, useEffect, useRef } from "react";
import { schedule } from "../../lib/schedule";
import { CalendarDays } from "lucide-react";

const DAY_LABELS = ["Fri", "Sat", "Sun"];

// Use local time strings (no UTC shift) — "2026-03-13T00:00:00" parses as LOCAL midnight
const RETREAT_DATES = [
  new Date("2026-03-13T00:00:00"),
  new Date("2026-03-14T00:00:00"),
  new Date("2026-03-15T00:00:00"),
];

const CATEGORY: Record<string, { bg: string; border: string; text: string }> = {
  session: { bg: "#e8f0e4", border: "#4a7c59", text: "#2a4d35" },
  prayer:  { bg: "#fdf3dc", border: "#b8872a", text: "#7a5a10" },
  groups:  { bg: "#e8eaf6", border: "#5c6bc0", text: "#3a4a8a" },
  meal:    { bg: "#f7efe5", border: "#b38b5d", text: "#6b4f2f" },
  free:    { bg: "#f0f0f0", border: "#9e9e9e", text: "#555555" },
  default: { bg: "#f5f0eb", border: "#a89070", text: "#5a4030" },
};

function getCat(title: string) {
  const t = title.toLowerCase();
  if (t.includes("session"))                                                    return "session";
  if (t.includes("prayer"))                                                     return "prayer";
  if (t.includes("small group") || t.includes("group"))                        return "groups";
  if (t.includes("breakfast") || t.includes("lunch") || t.includes("dinner"))  return "meal";
  if (t.includes("free") || t.includes("game") || t.includes("rest"))          return "free";
  return "default";
}

// Returns fractional hours from a single time token like "6:30am", "10pm", "12:00am"
function parseHour(raw: string): number {
  const clean = raw.trim().toLowerCase();
  const match = clean.match(/^(\d+)(?::(\d+))?\s*(am|pm)?$/);
  if (!match) return 0;
  let h = parseInt(match[1]);
  const min = match[2] ? parseInt(match[2]) : 0;
  const period = match[3];
  if (period === "pm" && h !== 12) h += 12;
  if (period === "am" && h === 12) h = 0;
  return h + min / 60;
}

// Splits "6:30–7:30am" into start/end tokens, inheriting am/pm when omitted
function splitTimeParts(raw: string): [string, string] | null {
  // Normalize all dash variants to –
  const normalized = raw.replace(/[—-]/g, "–").trim();
  const idx = normalized.indexOf("–");
  if (idx === -1) return null;
  const startRaw = normalized.slice(0, idx).trim();
  const endRaw   = normalized.slice(idx + 1).trim();

  // If start has no am/pm but end does, inherit it
  const hasPeriod = (s: string) => /am|pm/i.test(s);
  const endPeriod = endRaw.match(/(am|pm)/i)?.[1] ?? "";

  const start = hasPeriod(startRaw) ? startRaw : startRaw + endPeriod;
  return [start, endRaw];
}

function parseDuration(raw: string): number {
  const parts = splitTimeParts(raw);
  if (!parts) return 0.5;
  const s = parseHour(parts[0]);
  let e   = parseHour(parts[1]);
  if (e <= s) e += 24; // crosses midnight (e.g. 11pm–1am)
  return Math.max(e - s, 0.25);
}

// Builds a real local Date for a given retreat day + time string
function getEventDate(dayIdx: number, timeStr: string): Date {
  const parts = splitTimeParts(timeStr);
  if (!parts) return new Date(RETREAT_DATES[dayIdx]);

  const sh  = parseHour(parts[0]);
  const hrs = Math.floor(sh);
  const min = Math.round((sh - Math.floor(sh)) * 60);

  const base = new Date(RETREAT_DATES[dayIdx]);
  // If hour >= 24 it's past midnight — bump to next calendar day
  if (hrs >= 24) {
    base.setDate(base.getDate() + 1);
    base.setHours(hrs - 24, min, 0, 0);
  } else {
    base.setHours(hrs, min, 0, 0);
  }
  return base;
}

function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return "";
  const totalMins = Math.floor(diffMs / 60000);
  const days  = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins  = totalMins % 60;
  if (days > 0)               return `${days}d ${hours}h`;
  if (hours > 0 && mins > 0)  return `${hours}h ${mins}m`;
  if (hours > 0)              return `${hours}h`;
  return `${mins}m`;
}

export default function ScheduleTab() {
  const [activeDay, setActiveDay] = useState(0);
  const [now, setNow] = useState<Date>(() => new Date());
  const [showJumpButton, setShowJumpButton] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Determine current day based on date
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight for date comparison
    
    // Find which retreat day matches today's date
    let currentDayIndex = -1;
    for (let i = 0; i < RETREAT_DATES.length; i++) {
      const retreatDate = new Date(RETREAT_DATES[i]);
      retreatDate.setHours(0, 0, 0, 0);
      
      if (retreatDate.getTime() === today.getTime()) {
        currentDayIndex = i;
        break;
      }
    }
    
    // If we're on a retreat day, set it as active
    if (currentDayIndex !== -1) {
      setActiveDay(currentDayIndex);
      setShowJumpButton(false);
    } else {
      // If we're not on a retreat day, check if we're before or after
      const firstDay = new Date(RETREAT_DATES[0]);
      firstDay.setHours(0, 0, 0, 0);
      
      if (today < firstDay) {
        // Before retreat - show Friday
        setActiveDay(0);
        setShowJumpButton(false);
      } else {
        // After retreat - show that we're done, but allow jumping to any day
        setShowJumpButton(true);
      }
    }
  }, []); // Run once on mount

  const jumpToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < RETREAT_DATES.length; i++) {
      const retreatDate = new Date(RETREAT_DATES[i]);
      retreatDate.setHours(0, 0, 0, 0);
      
      if (retreatDate.getTime() === today.getTime()) {
        setActiveDay(i);
        setShowJumpButton(false);
        
        // Smooth scroll to schedule
        setTimeout(() => {
          scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;
      }
    }
  };

  const day = schedule[activeDay];

  // Scan all events in order to find current + next
  const { currentEvent, nextEvent } = (() => {
    let current: { title: string; time: string; endsAt: Date; cat: string } | null = null;
    let next: { title: string; time: string; startsAt: Date; cat: string; dayIdx: number } | null = null;

    for (let di = 0; di < schedule.length; di++) {
      for (const item of schedule[di].items) {
        const start = getEventDate(di, item.time);
        const dur   = parseDuration(item.time);
        const end   = new Date(start.getTime() + dur * 3600 * 1000);

        if (!current && start <= now && now < end) {
          current = { title: item.title, time: item.time, endsAt: end, cat: getCat(item.title) };
        }
        if (!next && start > now) {
          next = { title: item.title, time: item.time, startsAt: start, cat: getCat(item.title), dayIdx: di };
        }
        if (current && next) break;
      }
      if (current && next) break;
    }
    return { currentEvent: current, nextEvent: next };
  })();

  const bannerEvt    = currentEvent ?? nextEvent;
  const isCurrent    = !!currentEvent;
  const bannerColors = bannerEvt ? CATEGORY[bannerEvt.cat] : null;
  const bannerDiffMs = bannerEvt
    ? isCurrent
      ? currentEvent!.endsAt.getTime() - now.getTime()
      : nextEvent!.startsAt.getTime() - now.getTime()
    : 0;
  const bannerCountdown = formatCountdown(bannerDiffMs);

  return (
    <div className="flex flex-col h-dvh" ref={scheduleRef}>

      {/* Header */}
      <div className="px-5 pt-10 pb-3 shrink-0 fade-up delay-1">
        <p className="text-[10px] tracking-widest2 uppercase mb-1" style={{ color: "rgba(44,26,14,0.30)" }}>
          KCF Retreat 2026
        </p>
        <h2 className="text-[28px] font-medium tracking-tight leading-none mb-4" style={{ color: "#2c1a0e" }}>
          Schedule
        </h2>

        {/* Jump to Today button - only shows when not on current day */}
        {showJumpButton && (
          <button
            onClick={jumpToToday}
            className="mb-4 w-full py-2 px-3 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center gap-2 text-sm text-brown/70 hover:bg-gold/20 transition-colors"
          >
            <CalendarDays size={16} className="text-gold" />
            <span>Jump to today's schedule</span>
          </button>
        )}

        {/* Countdown banner */}
        {bannerEvt && bannerColors && (
          <div
            className="rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3"
            style={{ backgroundColor: bannerColors.bg, borderLeft: `3px solid ${bannerColors.border}` }}
          >
            <div className="min-w-0">
              <p className="text-[9px] tracking-widest uppercase mb-[3px]" style={{ color: bannerColors.border }}>
                {isCurrent
                  ? "Happening now"
                  : `Up next · ${DAY_LABELS[nextEvent!.dayIdx]} ${schedule[nextEvent!.dayIdx].date.split(" ")[1]} · ${bannerEvt.time.replace(/[—-]/g, "–")}`}
              </p>
              <p className="text-[13px] font-medium truncate" style={{ color: "#2c1a0e" }}>
                {bannerEvt.title}
              </p>
            </div>
            {bannerCountdown && (
              <div
                className="shrink-0 rounded-md px-2.5 py-1.5 text-center"
                style={{ background: bannerColors.border + "18" }}
              >
                <p className="text-[14px] font-semibold tabular-nums leading-none" style={{ color: bannerColors.border }}>
                  {bannerCountdown}
                </p>
                <p className="text-[8px] mt-[2px] tracking-wide" style={{ color: bannerColors.border + "99" }}>
                  {isCurrent ? "remaining" : "before"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Day switcher with current day indicator */}
        <div className="flex gap-1 mb-3">
          {schedule.map((d, i) => {
            const isActive = activeDay === i;
            
            // Check if this day is today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const retreatDate = new Date(RETREAT_DATES[i]);
            retreatDate.setHours(0, 0, 0, 0);
            const isToday = retreatDate.getTime() === today.getTime();
            
            return (
              <button
                key={d.date}
                onClick={() => setActiveDay(i)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all duration-150 relative"
                style={{ 
                  background: isActive ? "#2c1a0e" : "transparent",
                  border: isToday && !isActive ? "1px solid rgba(180, 150, 100, 0.3)" : "none"
                }}
              >
                {isToday && !isActive && (
                  <span className="absolute -top-1 right-1 w-1.5 h-1.5 rounded-full bg-gold" />
                )}
                <span
                  className="text-[9px] tracking-widest uppercase leading-none"
                  style={{ color: isActive ? "rgba(242,237,228,0.6)" : "rgba(44,26,14,0.35)" }}
                >
                  {DAY_LABELS[i]}
                  {isToday && !isActive && " •"}
                </span>
                <span
                  className="text-[18px] font-medium leading-none"
                  style={{ color: isActive ? "#f2ede4" : "rgba(44,26,14,0.55)" }}
                >
                  {d.date.split(" ")[1]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule list */}
      <div className="flex-1 overflow-y-auto pb-24 px-5 fade-up delay-2" key={activeDay}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-medium" style={{ color: "rgba(44,26,14,0.40)" }}>
            {day.day} · {day.date}
            {new Date(RETREAT_DATES[activeDay]).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) && (
              <span className="ml-2 text-[8px] text-gold">(Today)</span>
            )}
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(44,26,14,0.07)" }} />
        </div>

        <div className="space-y-1.5">
          {day.items.map((item, i) => {
            const cat        = getCat(item.title);
            const colors     = CATEGORY[cat];
            const eventStart = getEventDate(activeDay, item.time);
            const dur        = parseDuration(item.time);
            const eventEnd   = new Date(eventStart.getTime() + dur * 3600 * 1000);
            const isPast     = eventEnd < now;
            const isNow      = eventStart <= now && now < eventEnd;
            const isNext     = !isNow && eventStart > now &&
              nextEvent?.title === item.title &&
              nextEvent?.dayIdx === activeDay;

            return (
              <div
                key={i}
                className="flex items-stretch rounded-lg overflow-hidden"
                style={{
                  backgroundColor: colors.bg,
                  borderLeft: `3px solid ${colors.border}`,
                  opacity: isPast ? 0.4 : 1,
                  outline: isNow ? `1.5px solid ${colors.border}` : "none",
                }}
              >
                {/* Time */}
                <div
                  className="w-24 shrink-0 px-3 py-3 flex flex-col justify-center"
                  style={{ borderRight: `1px solid ${colors.border}22` }}
                >
                  <span className="text-[9px] tabular-nums leading-relaxed" style={{ color: colors.text + "bb" }}>
                    {item.time.replace(/[—-]/g, "–")}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 px-3 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-medium truncate leading-tight" style={{ color: colors.text }}>
                        {item.title}
                      </span>
                      
                    </div>
                    {item.subtitle && (
                      <p className="text-[10px] mt-0.5 leading-snug" style={{ color: colors.text + "88" }}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  {isNow && (
                    <span
                      className="shrink-0 text-[8px] font-semibold tracking-wide px-2 py-1 rounded-md"
                      style={{ background: colors.border, color: "#fff" }}
                    >
                      NOW
                    </span>
                  )}
                  {isNext && (
                    <span
                      className="shrink-0 text-[8px] font-medium tracking-wide px-2 py-1 rounded-md"
                      style={{ background: colors.border + "22", color: colors.border }}
                    >
                      NEXT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}