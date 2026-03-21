"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarDays } from "lucide-react";
import { ScheduleDay } from "@/lib/schedule";

const CATEGORY: Record<string, { bg: string; border: string; text: string }> = {
  session: { bg: "#ffffff", border: "#d4d4d4", text: "#171717" },
  prayer: { bg: "#ffffff", border: "#d4d4d4", text: "#171717" },
  groups: { bg: "#ffffff", border: "#d4d4d4", text: "#171717" },
  meal: { bg: "#ffffff", border: "#d4d4d4", text: "#171717" },
  free: { bg: "#f2f2f0", border: "#e0e0e0", text: "#171717" },
  default: { bg: "#ffffff", border: "#e0e0e0", text: "#171717" },
};

const CATEGORY_DARK: Record<string, { bg: string; border: string; text: string }> = {
  session: { bg: "#1e1e1e", border: "#444", text: "#ededed" },
  prayer: { bg: "#1e1e1e", border: "#444", text: "#ededed" },
  groups: { bg: "#1e1e1e", border: "#444", text: "#ededed" },
  meal: { bg: "#1e1e1e", border: "#444", text: "#ededed" },
  free: { bg: "#1e1e1e", border: "#444", text: "#ededed" },
  default: { bg: "#1e1e1e", border: "#333", text: "#ededed" },
};

function getCat(title: string) {
  const t = title.toLowerCase();
  if (t.includes("session")) return "session";
  if (t.includes("prayer")) return "prayer";
  if (t.includes("small group") || t.includes("group")) return "groups";
  if (t.includes("breakfast") || t.includes("lunch") || t.includes("dinner")) return "meal";
  if (t.includes("free") || t.includes("game") || t.includes("rest")) return "free";
  return "default";
}

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

function splitTimeParts(raw: string): [string, string] | null {
  const normalized = raw.replace(/[—-]/g, "–").trim();
  const idx = normalized.indexOf("–");
  if (idx === -1) return null;
  const startRaw = normalized.slice(0, idx).trim();
  const endRaw = normalized.slice(idx + 1).trim();
  const hasPeriod = (s: string) => /am|pm/i.test(s);
  const endPeriod = endRaw.match(/(am|pm)/i)?.[1] ?? "";
  const start = hasPeriod(startRaw) ? startRaw : startRaw + endPeriod;
  return [start, endRaw];
}

function parseDuration(raw: string): number {
  const parts = splitTimeParts(raw);
  if (!parts) return 0.5;
  const s = parseHour(parts[0]);
  let e = parseHour(parts[1]);
  if (e <= s) e += 24;
  return Math.max(e - s, 0.25);
}

function getEventDate(dayIdx: number, timeStr: string, retreatDates: Date[]): Date {
  const base = retreatDates[dayIdx] ? new Date(retreatDates[dayIdx]) : new Date();
  const parts = splitTimeParts(timeStr);
  if (!parts) return base;
  const sh = parseHour(parts[0]);
  const hrs = Math.floor(sh);
  const min = Math.round((sh - Math.floor(sh)) * 60);
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
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export default function ScheduleTab({ eventId, primaryColor, theme }: {
  eventId: string
  primaryColor: string
  theme: string
}) {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [retreatDates, setRetreatDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [now, setNow] = useState<Date>(() => new Date());
  const [showJumpButton, setShowJumpButton] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#f5f0eb' : '#2c1a0e';
  const subTextColor = isDark ? 'rgba(245,240,235,0.4)' : 'rgba(44,26,14,0.4)';
  const dividerColor = isDark ? 'rgba(245,240,235,0.07)' : 'rgba(44,26,14,0.07)';
  const CATS = isDark ? CATEGORY_DARK : CATEGORY;

  useEffect(() => {
    async function fetchSchedule() {
      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('event_id', eventId)
        .order('day')
        .order('position')

      if (error) { console.error(error); return; }
      if (!data || data.length === 0) { setLoading(false); return; }

      const maxDay = Math.max(...data.map((b: any) => b.day))
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dates = Array.from({ length: maxDay }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
      })
      setRetreatDates(dates)

      const days: ScheduleDay[] = Array.from({ length: maxDay }, (_, i) => ({
        day: `Day ${i + 1}`,
        date: '',
        items: [],
      }))

      for (const block of data) {
        days[block.day - 1].items.push({
          time: block.start_time,
          title: block.title,
          subtitle: block.description ?? undefined,
          highlight: block.category === 'Session',
        })
      }

      setSchedule(days)
      setLoading(false)
    }
    fetchSchedule()
  }, [eventId])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!retreatDates.length) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDayIndex = -1;
    for (let i = 0; i < retreatDates.length; i++) {
      const d = new Date(retreatDates[i]);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) { currentDayIndex = i; break; }
    }
    if (currentDayIndex !== -1) {
      setActiveDay(currentDayIndex);
      setShowJumpButton(false);
    } else {
      const firstDay = new Date(retreatDates[0]);
      firstDay.setHours(0, 0, 0, 0);
      setActiveDay(0);
      setShowJumpButton(today > firstDay);
    }
  }, [retreatDates]);

  if (loading) return (
    <div className="flex h-dvh items-center justify-center text-sm" style={{ color: subTextColor }}>
      Loading...
    </div>
  )
  if (!schedule.length) return null;

  const jumpToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < retreatDates.length; i++) {
      const d = new Date(retreatDates[i]);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) {
        setActiveDay(i);
        setShowJumpButton(false);
        setTimeout(() => scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        break;
      }
    }
  };

  const day = schedule[activeDay];

  const { currentEvent, nextEvent } = (() => {
    let current: { title: string; time: string; endsAt: Date; cat: string } | null = null;
    let next: { title: string; time: string; startsAt: Date; cat: string; dayIdx: number } | null = null;
    for (let di = 0; di < schedule.length; di++) {
      for (const item of schedule[di].items) {
        const start = getEventDate(di, item.time, retreatDates);
        const dur = parseDuration(item.time);
        const end = new Date(start.getTime() + dur * 3600 * 1000);
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

  const bannerEvt = currentEvent ?? nextEvent;
  const isCurrent = !!currentEvent;
  const bannerColors = bannerEvt ? CATS[bannerEvt.cat] : null;
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
        <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: subTextColor }}>
          Schedule
        </p>
        <h2 className="text-[28px] font-medium tracking-tight leading-none mb-4" style={{ color: textColor }}>
          Schedule
        </h2>

        {showJumpButton && (
          <button
            onClick={jumpToToday}
            className="mb-4 w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
            style={{ background: primaryColor + '18', border: `1px solid ${primaryColor}44`, color: primaryColor }}
          >
            <CalendarDays size={16} />
            <span>Jump to today's schedule</span>
          </button>
        )}

        {bannerEvt && bannerColors && (
          <div
            className="rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3"
            style={{
              backgroundColor: isDark ? '#1e1e1e' : '#f2f2f0',
              borderLeft: `3px solid ${primaryColor}`,
            }}
          >
            <div className="min-w-0">
              <p className="text-[9px] tracking-widest uppercase mb-[3px]" style={{ color: primaryColor }}>
                {isCurrent ? "Happening now" : `Up next · Day ${(nextEvent!.dayIdx + 1)} · ${bannerEvt.time.replace(/[—-]/g, "–")}`}
              </p>
              <p className="text-[13px] font-medium truncate" style={{ color: textColor }}>
                {bannerEvt.title}
              </p>
            </div>
            {bannerCountdown && (
              <div
                className="shrink-0 rounded-md px-2.5 py-1.5 text-center"
                style={{ background: primaryColor + "18" }}
              >
                <p className="text-[14px] font-semibold tabular-nums leading-none" style={{ color: primaryColor }}>
                  {bannerCountdown}
                </p>
                <p className="text-[8px] mt-[2px] tracking-wide" style={{ color: primaryColor + "99" }}>
                  {isCurrent ? "remaining" : "before"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Day switcher */}
        <div className="flex gap-1 mb-3">
          {schedule.map((d, i) => {
            const isActive = activeDay === i;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const retreatDate = retreatDates[i] ? new Date(retreatDates[i]) : null;
            if (retreatDate) retreatDate.setHours(0, 0, 0, 0);
            const isToday = retreatDate?.getTime() === today.getTime();

            return (
              <button
                key={`day-btn-${i}`}
                onClick={() => setActiveDay(i)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all duration-150 relative"
                style={{
                  background: isActive ? primaryColor : "transparent",
                  border: isToday && !isActive ? `1px solid ${primaryColor}44` : "none",
                }}
              >
                {isToday && !isActive && (
                  <span className="absolute -top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: primaryColor }} />
                )}
                <span
                  className="text-[9px] tracking-widest uppercase leading-none"
                  style={{ color: isActive ? 'rgba(255,255,255,0.8)' : subTextColor }}
                >
                  {`Day ${i + 1}`}{isToday && !isActive && " •"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule list */}
      <div className="flex-1 overflow-y-auto pb-24 px-5 fade-up delay-2" key={`day-content-${activeDay}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-medium" style={{ color: subTextColor }}>
            {day.day}
            {retreatDates[activeDay] && new Date(retreatDates[activeDay]).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0) && (
              <span className="ml-2 text-[8px]" style={{ color: primaryColor }}>(Today)</span>
            )}
          </span>
          <div className="flex-1 h-px" style={{ background: dividerColor }} />
        </div>

        <div className="space-y-1.5">
          {day.items.map((item, i) => {
            const cat = getCat(item.title);
            const colors = CATS[cat];
            const eventStart = getEventDate(activeDay, item.time, retreatDates);
            const dur = parseDuration(item.time);
            const eventEnd = new Date(eventStart.getTime() + dur * 3600 * 1000);
            const isPast = eventEnd < now;
            const isNow = eventStart <= now && now < eventEnd;
            const isNext = !isNow && eventStart > now &&
              nextEvent?.title === item.title &&
              nextEvent?.dayIdx === activeDay;

            return (
              <div
                key={`block-${activeDay}-${i}`}
                className="flex items-stretch rounded-lg overflow-hidden"
                style={{
                  backgroundColor: colors.bg,
                  borderLeft: `3px solid ${colors.border}`,
                  opacity: isPast ? 0.4 : 1,
                  outline: isNow ? `1.5px solid ${colors.border}` : "none",
                }}
              >
                <div
                  className="w-24 shrink-0 px-3 py-3 flex flex-col justify-center"
                  style={{ borderRight: `1px solid ${colors.border}22` }}
                >
                  <span className="text-[9px] tabular-nums leading-relaxed" style={{ color: colors.text + "bb" }}>
                    {item.time.replace(/[—-]/g, "–")}
                  </span>
                </div>
                <div className="flex-1 px-3 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[12px] font-medium truncate leading-tight" style={{ color: colors.text }}>
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <p className="text-[10px] mt-0.5 leading-snug" style={{ color: colors.text + "88" }}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  {isNow && (
                    <span className="shrink-0 text-[8px] font-semibold tracking-wide px-2 py-1 rounded-md"
                      style={{ background: primaryColor, color: "#fff" }}>
                      NOW
                    </span>
                  )}
                  {isNext && (
                    <span className="shrink-0 text-[8px] font-medium tracking-wide px-2 py-1 rounded-md"
                      style={{ background: primaryColor + "22", color: primaryColor }}>
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