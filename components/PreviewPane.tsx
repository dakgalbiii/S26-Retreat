"use client";

import { useState, useMemo, useRef } from "react";
import { Calendar, Users, Megaphone, Link as LinkIcon } from "lucide-react";
import type { Block as ContentBlock } from "./BlockEditor";
import BlockRenderer from "./BlockRenderer";

// ── Types ─────────────────────────────────────────────────────────────────────
type Block = {
  id: string; day: number; start_time: string; title: string;
  description: string | null; location: string | null; category: string | null; position: number;
}
type DayMeta      = { day: number; label: string; date: string; }
type Member       = { id: string; name: string; group_id: string; }
type Group        = { id: string; name: string; position: number; members: Member[]; }
type Announcement = { id: string; body: string; created_at: string; }
type Link         = { id: string; label: string; url: string; position: number; }
type Tab          = { key: string; label: string; visible: boolean; }

interface PreviewPaneProps {
  title: string;
  tagline: string;
  primaryColor: string;
  theme: string;
  font: string;
  tabs: Tab[];
  blocks: Block[];
  days: DayMeta[];
  groups: Group[];
  announcements: Announcement[];
  links: Link[];
  tabContent: Record<string, ContentBlock[]>;
}

// ── Time helpers ──────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0") }

function parseBlockTimes(start_time: string): { startMin: number; endMin: number } | null {
  const normalized = start_time.replace(/[—-]/g, "–").trim();
  const parts = normalized.split("–");
  if (parts.length !== 2) return null;

  const parsePart = (s: string): number | null => {
    s = s.trim();
    const match24 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) return parseInt(match24[1]) * 60 + parseInt(match24[2]);
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
  const hasPeriod = (s: string) => /am|pm/i.test(s);

  if (!hasPeriod(startStr) && hasPeriod(endStr)) {
    const endPeriod  = endStr.match(/(am|pm)/i)?.[1] ?? "";
    const startHour  = parseInt(startStr.split(":")[0]);
    const endHour    = parseInt(endStr.split(":")[0]);
    if (startHour <= endHour || endStr.toLowerCase().includes("am")) {
      startStr = startStr + endPeriod;
    } else {
      startStr = startStr + "pm";
    }
  }

  const s = parsePart(startStr);
  const e = parsePart(endStr);
  if (s === null || e === null) return null;
  return { startMin: s, endMin: e <= s ? e + 24 * 60 : e };
}

function minutesToDisplay(min: number): string {
  const h      = Math.floor(min / 60) % 24;
  const m      = min % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${pad(m)} ${period}`;
}

// ── Tab icon map ──────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, React.ElementType> = {
  schedule:      Calendar,
  groups:        Users,
  announcements: Megaphone,
  links:         LinkIcon,
}

// ── Schedule preview ──────────────────────────────────────────────────────────
function SchedulePreview({ blocks, days, primaryColor, theme }: {
  blocks: Block[]; days: DayMeta[]; primaryColor: string; theme: string;
}) {
  const [activeDay, setActiveDay] = useState(0);
  const isDark    = theme === "dark";
  const textColor = isDark ? "#ededed"               : "#171717";
  const subText   = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const border    = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const surface   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

  const dayBlocks = blocks
    .filter(b => b.day === (activeDay + 1))
    .sort((a, b) => {
      const at = parseBlockTimes(a.start_time);
      const bt = parseBlockTimes(b.start_time);
      return (at?.startMin ?? 0) - (bt?.startMin ?? 0);
    });

  return (
    <div className="flex flex-col h-full">
      <p className="text-[9px] uppercase tracking-widest mb-1 px-4 pt-4" style={{ color: subText }}>Schedule</p>
      <h2 className="text-[20px] font-semibold tracking-tight px-4 mb-3" style={{ color: textColor }}>Schedule</h2>

      {/* Day tabs */}
      {days.length > 1 && (
        <div className="flex gap-1 px-4 mb-3">
          {days.map((day, i) => (
            <button
              key={day.day}
              onClick={() => setActiveDay(i)}
              className="flex-1 py-1.5 rounded-lg text-[9px] font-medium transition-all"
              style={{
                background: activeDay === i ? primaryColor : "transparent",
                color:      activeDay === i ? "#fff" : subText,
                border:     activeDay === i ? "none" : `1px solid ${border}`,
              }}
            >
              {day.label || `Day ${day.day}`}
            </button>
          ))}
        </div>
      )}

      {/* Blocks */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1.5">
        {dayBlocks.length === 0 ? (
          <p className="text-[11px] text-center py-8" style={{ color: subText }}>No blocks yet</p>
        ) : dayBlocks.map(block => {
          const times = parseBlockTimes(block.start_time);
          return (
            <div
              key={block.id}
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: surface, border: `1px solid ${border}` }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium leading-tight truncate" style={{ color: textColor }}>
                  {block.title}
                </p>
                {times && (
                  <p className="text-[9px] mt-0.5 font-mono" style={{ color: subText }}>
                    {minutesToDisplay(times.startMin)} – {minutesToDisplay(times.endMin)}
                  </p>
                )}
                {block.location && (
                  <p className="text-[9px] mt-0.5 truncate" style={{ color: subText }}>{block.location}</p>
                )}
              </div>
              {block.category && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
                  style={{ background: border, color: subText }}>
                  {block.category}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Groups preview ────────────────────────────────────────────────────────────
function GroupsPreview({ groups, primaryColor, theme }: {
  groups: Group[]; primaryColor: string; theme: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen]     = useState<string | null>(null);
  const isDark    = theme === "dark";
  const textColor = isDark ? "#ededed"               : "#171717";
  const subText   = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const border    = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.members.some(m => m.name.toLowerCase().includes(q))
    );
  }, [search, groups]);

  return (
    <div className="flex flex-col h-full">
      <p className="text-[9px] uppercase tracking-widest mb-1 px-4 pt-4" style={{ color: subText }}>Groups</p>
      <h2 className="text-[20px] font-semibold tracking-tight px-4 mb-3" style={{ color: textColor }}>Groups</h2>

      {/* Search */}
      <div className="px-4 mb-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your name..."
          className="w-full px-3 py-1.5 rounded-xl text-[11px] outline-none"
          style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: `1px solid ${border}`, color: textColor }}
        />
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1.5">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-center py-8" style={{ color: subText }}>
            {search ? `No results for "${search}"` : "No groups yet"}
          </p>
        ) : filtered.map(group => (
          <div key={group.id} className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${border}` }}>
            <button
              onClick={() => setOpen(open === group.id ? null : group.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left"
            >
              <span className="text-[11px] font-medium" style={{ color: textColor }}>{group.name}</span>
              <span className="text-[9px]" style={{ color: subText }}>{group.members.length} members</span>
            </button>
            {open === group.id && group.members.length > 0 && (
              <div className="px-3 pb-2.5" style={{ borderTop: `1px solid ${border}` }}>
                <div className="pt-2 grid grid-cols-2 gap-1">
                  {group.members.map(m => (
                    <span key={m.id} className="text-[10px]" style={{ color: subText }}>{m.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Announcements preview ─────────────────────────────────────────────────────
function AnnouncementsPreview({ announcements, label, theme }: {
  announcements: Announcement[]; label: string; theme: string;
}) {
  const isDark    = theme === "dark";
  const textColor = isDark ? "#ededed"               : "#171717";
  const subText   = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const border    = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const surface   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

  return (
    <div className="flex flex-col h-full">
      <p className="text-[9px] uppercase tracking-widest mb-1 px-4 pt-4" style={{ color: subText }}>Updates</p>
      <h2 className="text-[20px] font-semibold tracking-tight px-4 mb-3" style={{ color: textColor }}>{label}</h2>
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
        {announcements.length === 0 ? (
          <p className="text-[11px] text-center py-8" style={{ color: subText }}>No announcements yet</p>
        ) : announcements.map(a => (
          <div key={a.id} className="px-3 py-2.5 rounded-xl"
            style={{ background: surface, border: `1px solid ${border}` }}>
            <p className="text-[11px] leading-relaxed" style={{ color: textColor }}>{a.body}</p>
            <p className="text-[9px] mt-1" style={{ color: subText }}>
              {new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Links preview ─────────────────────────────────────────────────────────────
function LinksPreview({ links, label, theme }: {
  links: Link[]; label: string; theme: string;
}) {
  const isDark    = theme === "dark";
  const textColor = isDark ? "#ededed"               : "#171717";
  const subText   = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const border    = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const surface   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

  return (
    <div className="flex flex-col h-full">
      <p className="text-[9px] uppercase tracking-widest mb-1 px-4 pt-4" style={{ color: subText }}>Links</p>
      <h2 className="text-[20px] font-semibold tracking-tight px-4 mb-3" style={{ color: textColor }}>{label}</h2>
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
        {links.length === 0 ? (
          <p className="text-[11px] text-center py-8" style={{ color: subText }}>No links yet</p>
        ) : links.map(link => (
          <div key={link.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: surface, border: `1px solid ${border}` }}>
            <span className="text-[11px] font-medium truncate" style={{ color: textColor }}>{link.label}</span>
            <span className="text-[9px] ml-2 shrink-0" style={{ color: subText }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main PreviewPane ──────────────────────────────────────────────────────────
export default function PreviewPane({
  title, tagline, primaryColor, theme, font, tabs,
  blocks, days, groups, announcements, links, tabContent,
}: PreviewPaneProps) {
  const isDark      = theme === "dark";
  const bgColor     = isDark ? "#141414" : "#fafafa";
  const textColor   = isDark ? "#ededed" : "#171717";
  const subText     = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const navBg       = isDark ? "rgba(20,20,20,0.95)"   : "rgba(250,250,250,0.95)";
  const navBorder   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const fontFamily =
    font === "serif" ? "Georgia, serif" :
    font === "mono"  ? "monospace"       :
    "inherit";

  const visibleTabs = tabs.filter(t => t.visible);
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.key ?? "schedule");

  // Reset active tab if it's no longer visible
  const activeTabVisible = visibleTabs.some(t => t.key === activeTab);
  const currentTab = activeTabVisible ? activeTab : (visibleTabs[0]?.key ?? "schedule");

  const activeTabMeta = visibleTabs.find(t => t.key === currentTab);

  return (
    <div
      className="flex flex-col h-full rounded-[2.5rem] overflow-hidden select-none"
      style={{
        background:  bgColor,
        fontFamily,
        color:       textColor,
        border:      `1px solid ${navBorder}`,
        boxShadow:   "0 24px 60px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      {/* Status bar mock */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1 shrink-0">
        <span className="text-[10px] font-semibold" style={{ color: textColor }}>9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-1.5 rounded-sm border" style={{ borderColor: textColor, opacity: 0.5 }}>
            <div className="h-full w-2/3 rounded-sm" style={{ background: textColor, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Top nav */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: `1px solid ${navBorder}` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: primaryColor }} />
          <span className="text-[12px] font-semibold truncate" style={{ color: textColor }}>{title || "Event"}</span>
          {tagline && (
            <span className="text-[10px] truncate hidden" style={{ color: subText }}>{tagline}</span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {visibleTabs.map(tab => {
            const Icon = TAB_ICONS[tab.key] ?? Calendar;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] transition-all"
                style={{
                  background: currentTab === tab.key ? primaryColor + "18" : "transparent",
                  color:      currentTab === tab.key ? primaryColor : subText,
                  fontWeight: currentTab === tab.key ? 600 : 400,
                }}
              >
                <Icon size={10} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentTab === "schedule" && (
          <SchedulePreview
            blocks={blocks} days={days}
            primaryColor={primaryColor} theme={theme}
          />
        )}
        {currentTab === "groups" && (
          <GroupsPreview
            groups={groups} primaryColor={primaryColor} theme={theme}
          />
        )}
        {currentTab === "announcements" && (
          <AnnouncementsPreview
            announcements={announcements}
            label={activeTabMeta?.label ?? "Updates"}
            theme={theme}
          />
        )}
        {currentTab === "links" && (
          <LinksPreview
            links={links}
            label={activeTabMeta?.label ?? "Links"}
            theme={theme}
          />
        )}
        {!["schedule", "groups", "announcements", "links"].includes(currentTab) && (
          <div className="px-4 pt-4 pb-4">
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: subText }}>
              {activeTabMeta?.label}
            </p>
            <h2 className="text-[20px] font-semibold tracking-tight mb-3" style={{ color: textColor }}>
              {activeTabMeta?.label}
            </h2>
            <BlockRenderer
              blocks={tabContent[currentTab] ?? []}
              primaryColor={primaryColor}
              theme={theme}
            />
          </div>
        )}
      </div>

      {/* Bottom nav — mobile style */}
      <div
        className="shrink-0 flex justify-around px-2 py-2 border-t"
        style={{ background: navBg, borderColor: navBorder }}
      >
        {visibleTabs.slice(0, 4).map(tab => {
          const Icon = TAB_ICONS[tab.key] ?? Calendar;
          const active = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg"
            >
              <Icon size={14} style={{ color: active ? primaryColor : subText }} />
              <span className="text-[8px] uppercase tracking-widest"
                style={{ color: active ? primaryColor : subText, fontWeight: active ? 600 : 400 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}