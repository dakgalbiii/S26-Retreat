"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { useTheme, tokens, inputStyle } from "../../../../../../lib/theme/theme-context";
import {
  ExternalLink, Copy, Calendar, Users, Megaphone,
  Link as LinkIcon, Palette, GripVertical, Plus,
  Trash2, X, Check, Send, ChevronDown, UserPlus,
  Upload, FileText,
  Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import CalendarView from "@/components/CalendarView";
import PreviewPane from "@/components/PreviewPane";
import { cacheGet, cacheSet, cacheClear } from "@/lib/cache";
import BlockEditor, { Block as ContentBlock } from "@/components/BlockEditor";



// ── Types ─────────────────────────────────────────────────────────────────────
type Event = {
  id: string; slug: string; title: string; tagline: string;
  access_code: string; primary_color: string; theme: string; font: string;
  tabs: { key: string; label: string; visible: boolean }[];
  day_meta: DayMeta[] | null;
}
type Block = { id: string; day: number; start_time: string; title: string; description: string | null; location: string | null; category: string | null; position: number; }
type DayMeta = { day: number; label: string; date: string; }
type Member = { id: string; name: string; group_id: string; }
type Group = { id: string; name: string; position: number; members: Member[]; }
type Announcement = { id: string; body: string; created_at: string; }
type Link = { id: string; label: string; url: string; position: number; }
type Design = { primary_color: string; theme: string; font: string; tabs: { key: string; label: string; visible: boolean }[]; }
type EventCache = { event: Event; blocks: Block[]; days: DayMeta[]; groups: Group[]; announcements: Announcement[]; links: Link[]; design: Design; tabContent: Record<string, ContentBlock[]>; }

// ── Constants ─────────────────────────────────────────────────────────────────
const BUILTIN_KEYS = ["schedule", "groups", "announcements", "links"]
const PRESET_COLORS = ["#000000", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#8b5cf6"]
const FONTS = [
  { value: "default", label: "Sans", sample: "Aa" },
  { value: "serif", label: "Serif", sample: "Aa" },
  { value: "mono", label: "Mono", sample: "Aa" },
]
const DEFAULT_DESIGN: Design = {
  primary_color: '#000000', theme: 'light', font: 'default',
  tabs: [
    { key: 'schedule', label: 'Schedule', visible: true },
    { key: 'groups', label: 'Groups', visible: true },
    { key: 'announcements', label: 'Announcements', visible: true },
    { key: 'links', label: 'Links', visible: true },
  ]
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ id, label, children, t }: {
  id: string; label: string; children: React.ReactNode; t: ReturnType<typeof tokens>;
}) {
  return (
    <section id={id} className="scroll-mt-20 pb-16">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-[22px] font-semibold tracking-tight" style={{ color: t.text }}>{label}</h2>
        <div className="flex-1 h-px" style={{ background: t.border }} />
      </div>
      {children}
    </section>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EventDashboardPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("schedule");

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [days, setDays] = useState<DayMeta[]>([{ day: 1, label: "Day 1", date: "" }]);

  const [groups, setGroups] = useState<Group[]>([]);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annBody, setAnnBody] = useState("");
  const [savingAnn, setSavingAnn] = useState(false);

  const [links, setLinks] = useState<Link[]>([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN);
  const [savingDesign, setSavingDesign] = useState(false);
  const [designSaved, setDesignSaved] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [addingTab, setAddingTab] = useState(false);

  const [tabContent, setTabContent] = useState<Record<string, ContentBlock[]>>({});
  const [savingContent, setSavingContent] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState<string | null>(null);

  const [showPreview, setShowPreview] = useState(false);

  // CSV import
  const [csvMode, setCsvMode] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvParsed, setCsvParsed] = useState<{ group: string; members: string[] }[]>([]);
  const [csvError, setCsvError] = useState("");
  const [importingCsv, setImportingCsv] = useState(false);

  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();
  const { theme } = useTheme();
  const t = tokens(theme);
  const mainRef = useRef<HTMLDivElement>(null);

  // ── Load with caching ─────────────────────────────────────────────────────
  useEffect(() => {
    const cacheKey = `prelude:event:${id}`;

    // 1. Show cache instantly
    const cached = cacheGet<EventCache>(cacheKey);
    if (cached) {
      setEvent(cached.event);
      setBlocks(cached.blocks);
      setDays(cached.days);
      setGroups(cached.groups);
      setAnnouncements(cached.announcements);
      setLinks(cached.links);
      setDesign(cached.design);
      setLoading(false);
      setTabContent(cached.tabContent ?? {});
    }

    // 2. Always fetch fresh in background
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }

      const [
        { data: ev },
        { data: blk },
        { data: grpRows },
        { data: memRows },
        { data: ann },
        { data: lnk },
      ] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('schedule_blocks').select('*').eq('event_id', id).order('day').order('position'),
        supabase.from('groups').select('*').eq('event_id', id).order('position'),
        supabase.from('members').select('*'),
        supabase.from('announcements').select('*').eq('event_id', id).order('created_at', { ascending: false }),
        supabase.from('links').select('*').eq('event_id', id).order('position'),
      ])

      const freshDesign: Design = {
        primary_color: ev?.primary_color ?? '#000000',
        theme: ev?.theme ?? 'light',
        font: ev?.font ?? 'default',
        tabs: ev?.tabs ?? DEFAULT_DESIGN.tabs,
      }

      const freshDays: DayMeta[] = ev?.day_meta && ev.day_meta.length > 0
        ? ev.day_meta
        : blk && blk.length > 0
          ? Array.from({ length: Math.max(...blk.map((b: Block) => b.day)) }, (_, i) => ({
            day: i + 1, label: `Day ${i + 1}`, date: ""
          }))
          : [{ day: 1, label: "Day 1", date: "" }];

      const freshGroups: Group[] = (grpRows ?? []).map((g: any) => ({
        ...g, members: (memRows ?? []).filter((m: any) => m.group_id === g.id)
      }));

      if (ev) setEvent(ev);
      setDesign(freshDesign);
      setBlocks(blk ?? []);
      setDays(freshDays);
      setGroups(freshGroups);
      setAnnouncements(ann ?? []);
      setLinks(lnk ?? []);
      setLoading(false);

      if (ev) {
        setEvent(ev)
        setTabContent(ev.tab_content ?? {})
        cacheSet<EventCache>(cacheKey, {
          event: ev,
          blocks: blk ?? [],
          days: freshDays,
          groups: freshGroups,
          announcements: ann ?? [],
          links: lnk ?? [],
          design: freshDesign,
          tabContent: ev.tab_content ?? {},
        });
      }
    }

    load();
  }, [])

  // ── Scroll spy ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    const sections = ["schedule", "groups", "announcements", "links", "design"]
    const observers = sections.map(sec => {
      const el = document.getElementById(sec)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(sec) },
        { rootMargin: "-20% 0px -70% 0px" }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [loading])

  function scrollTo(sec: string) {
    document.getElementById(sec)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(sec)
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/e/${event?.slug}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // ── Group handlers ────────────────────────────────────────────────────────
  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!groupName.trim()) return
    setSavingGroup(true)
    const { data, error } = await supabase.from('groups')
      .insert({ event_id: id, name: groupName, position: groups.length }).select().single()
    if (error) { console.error(error); setSavingGroup(false); return; }
    setGroups(prev => [...prev, { ...data, members: [] }])
    setGroupName(""); setOpenGroup(data.id); setSavingGroup(false)
  }

  async function handleDeleteGroup(groupId: string) {
    await supabase.from('groups').delete().eq('id', groupId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
    if (openGroup === groupId) setOpenGroup(null)
  }

  async function handleAddMember(e: React.FormEvent, groupId: string) {
    e.preventDefault()
    if (!memberName.trim()) return
    setSavingGroup(true)
    const { data, error } = await supabase.from('members')
      .insert({ group_id: groupId, name: memberName }).select().single()
    if (error) { console.error(error); setSavingGroup(false); return; }
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: [...g.members, data] } : g))
    setMemberName(""); setSavingGroup(false)
  }

  async function handleDeleteMember(groupId: string, memberId: string) {
    await supabase.from('members').delete().eq('id', memberId)
    setGroups(prev => prev.map(g => g.id === groupId
      ? { ...g, members: g.members.filter(m => m.id !== memberId) } : g))
  }

  // ── CSV handlers ──────────────────────────────────────────────────────────
  function parseCSV(text: string): { group: string; members: string[] }[] {
    const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
    const grouped: Record<string, string[]> = {};

    for (const line of lines) {
      // Support: "Group Name, Member Name" or "Member Name, Group Name"
      // Also support just "Member Name" with no group (goes to "Ungrouped")
      const parts = line.split(",").map(p => p.trim()).filter(Boolean);
      if (parts.length === 0) continue;

      if (parts.length === 1) {
        // Just a name, add to Ungrouped
        const g = "Ungrouped";
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(parts[0]);
      } else if (parts.length === 2) {
        // "Group, Member" format
        const [group, member] = parts;
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(member);
      } else {
        // First column is group, rest are members on same row
        const [group, ...members] = parts;
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(...members);
      }
    }

    return Object.entries(grouped).map(([group, members]) => ({ group, members }));
  }

  function handleCsvChange(text: string) {
    setCsvText(text);
    setCsvError("");
    if (!text.trim()) { setCsvParsed([]); return; }
    try {
      const parsed = parseCSV(text);
      setCsvParsed(parsed);
    } catch {
      setCsvError("Could not parse CSV. Check the format.");
      setCsvParsed([]);
    }
  }

  async function handleImportCSV() {
    if (csvParsed.length === 0) return;
    setImportingCsv(true);

    try {
      for (const { group: groupName, members } of csvParsed) {
        // Create group
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .insert({ event_id: id, name: groupName, position: groups.length })
          .select().single();

        if (groupError) { console.error(groupError); continue; }

        // Create members in bulk
        if (members.length > 0) {
          const memberRows = members.map(name => ({ group_id: groupData.id, name }));
          const { data: memberData, error: memberError } = await supabase
            .from('members').insert(memberRows).select();

          if (memberError) { console.error(memberError); continue; }

          setGroups(prev => [...prev, {
            ...groupData,
            members: memberData ?? [],
          }]);
        } else {
          setGroups(prev => [...prev, { ...groupData, members: [] }]);
        }
      }

      // Reset
      setCsvText(""); setCsvParsed([]); setCsvMode(false);
      cacheClear(`prelude:event:${id}`);
    } catch (err) {
      console.error(err);
      setCsvError("Import failed. Please try again.");
    } finally {
      setImportingCsv(false);
    }
  }

  // ── Announcement handlers ─────────────────────────────────────────────────
  async function handlePostAnn(e: React.FormEvent) {
    e.preventDefault()
    if (!annBody.trim()) return
    setSavingAnn(true)
    const { data, error } = await supabase.from('announcements')
      .insert({ event_id: id, body: annBody }).select().single()
    if (error) { console.error(error); setSavingAnn(false); return; }
    setAnnouncements(prev => [data, ...prev])
    setAnnBody(""); setSavingAnn(false)
  }

  async function handleDeleteAnn(annId: string) {
    await supabase.from('announcements').delete().eq('id', annId)
    setAnnouncements(prev => prev.filter(a => a.id !== annId))
  }

  // ── Link handlers ─────────────────────────────────────────────────────────
  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault()
    if (!linkLabel || !linkUrl) return
    setSavingLink(true)
    const { data, error } = await supabase.from('links')
      .insert({ event_id: id, label: linkLabel, url: linkUrl, position: links.length }).select().single()
    if (error) { console.error(error); setSavingLink(false); return; }
    setLinks(prev => [...prev, data])
    setLinkLabel(""); setLinkUrl(""); setSavingLink(false)
  }

  async function handleDeleteLink(linkId: string) {
    await supabase.from('links').delete().eq('id', linkId)
    setLinks(prev => prev.filter(l => l.id !== linkId))
  }

  // ── Design handlers ───────────────────────────────────────────────────────
  async function handleSaveDesign() {
    setSavingDesign(true)
    const { error } = await supabase.from('events').update(design).eq('id', id)
    if (error) { console.error(error); setSavingDesign(false); return; }
    setDesignSaved(true); setSavingDesign(false)
    setTimeout(() => setDesignSaved(false), 2000)
    cacheClear(`prelude:event:${id}`) // invalidate so next load gets fresh design
  }

  async function handleSaveTabContent(tabKey: string) {
    setSavingContent(tabKey)
    const updatedContent = { ...tabContent }
    const { error } = await supabase.from('events')
      .update({ tab_content: updatedContent }).eq('id', id)
    if (error) { console.error(error); setSavingContent(null); return; }
    setSavedContent(tabKey); setSavingContent(null)
    setTimeout(() => setSavedContent(null), 2000)
    cacheClear(`prelude:event:${id}`)
  }

  function updateTab(key: string, field: 'label' | 'visible', value: string | boolean) {
    setDesign(prev => ({ ...prev, tabs: prev.tabs.map(tab => tab.key === key ? { ...tab, [field]: value } : tab) }))
  }

  function deleteTab(key: string) {
    setDesign(prev => ({ ...prev, tabs: prev.tabs.filter(tab => tab.key !== key) }))
  }

  function addCustomTab() {
    if (!newTabLabel.trim()) return
    const key = `custom_${newTabLabel.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
    setDesign(prev => ({ ...prev, tabs: [...prev.tabs, { key, label: newTabLabel.trim(), visible: true }] }))
    setNewTabLabel(""); setAddingTab(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex h-full items-center justify-center text-[15px]" style={{ color: t.textSub }}>
      Loading...
    </div>
  )
  if (!event) return null

  const lbl = { color: t.textSub, fontSize: "13px", fontWeight: 500 } as React.CSSProperties
  const navSections = [
    { key: "schedule", label: "Schedule", icon: Calendar },
    { key: "groups", label: "Groups", icon: Users },
    { key: "announcements", label: "Announcements", icon: Megaphone },
    { key: "links", label: "Links", icon: LinkIcon },
    { key: "design", label: "Design", icon: Palette },
    // Custom tabs appear in nav automatically
    ...design.tabs
      .filter(tab => !BUILTIN_KEYS.includes(tab.key) && tab.visible)
      .map(tab => ({ key: tab.key, label: tab.label, icon: Palette })),
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto"
      ref={mainRef}
    >
      {/* ── Page header ── */}
      <div className="px-10 pt-10 pb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-4 h-4 rounded-full mt-2 shrink-0" style={{ background: event.primary_color }} />
            <div>
              <h1 className="text-[30px] font-semibold tracking-tight leading-none mb-1" style={{ color: t.text }}>
                {event.title}
              </h1>
              {event.tagline && <p className="text-[15px]" style={{ color: t.textSub }}>{event.tagline}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Preview button (for future use) */}
            {/* <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowPreview(p => !p)}
              className="flex items-center gap-2 px-4 py-2 text-[13px] rounded-xl hover:opacity-70 transition-opacity"
              style={{ border: `1px solid ${t.border}`, color: showPreview ? t.text : t.textSub, background: showPreview ? t.surface : 'transparent' }}
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPreview ? "Hide preview" : "Preview"}
            </motion.button> */}
            <motion.a
              whileTap={{ scale: 0.97 }}
              href={`/e/${event.slug}`} target="_blank"
              className="flex items-center gap-2 px-4 py-2 text-[13px] rounded-xl hover:opacity-70 transition-opacity"
              style={{ border: `1px solid ${t.border}`, color: t.textSub }}
            >
              <ExternalLink size={13} /> Open
            </motion.a>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-xl hover:opacity-80 transition-opacity"
              style={{ background: t.btnBg, color: t.btnText }}
            >
              <Copy size={13} /> {copied ? "Copied!" : "Copy link"}
            </motion.button>
          </div>

        </div>

        <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden" style={{ background: t.border }}>
          {[
            { label: "Link", value: `/e/${event.slug}`, mono: true },
            { label: "Code", value: event.access_code, mono: true },
            { label: "Color", value: event.primary_color, mono: true, color: event.primary_color },
          ].map((item, i) => (
            <div key={i} className="px-5 py-3" style={{ background: t.surface }}>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: t.textFaint }}>{item.label}</p>
              <div className="flex items-center gap-2">
                {item.color && <div className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />}
                <p className={`text-[13px] ${item.mono ? 'font-mono' : ''} truncate`} style={{ color: t.text }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sticky workspace bar ── */}
      <div className="sticky top-0 z-30 px-10 py-3 backdrop-blur-sm"
        style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: event.primary_color }} />
            <p className="text-[13px] truncate" style={{ color: t.text }}>
              {event.title}
            </p>
            <p className="text-[11px] font-mono truncate" style={{ color: t.textFaint }}>
              /e/{event.slug}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!addingTab ? (
              <button
                onClick={() => setAddingTab(true)}
                className="px-3 py-1.5 rounded-lg text-[12px]"
                style={{ border: `1px solid ${t.border}`, color: t.textSub }}
              >
                + New tab
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTabLabel}
                  onChange={e => setNewTabLabel(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addCustomTab();
                    if (e.key === 'Escape') {
                      setAddingTab(false);
                      setNewTabLabel("");
                    }
                  }}
                  placeholder="Tab name"
                  autoFocus
                  className="px-3 py-1.5 rounded-lg text-[12px] outline-none"
                  style={{
                    border: `1px solid ${t.border}`,
                    background: t.inputBg,
                    color: t.text,
                    width: '140px',
                  }}
                />
                <button
                  onClick={addCustomTab}
                  disabled={!newTabLabel.trim()}
                  className="px-3 py-1.5 rounded-lg text-[12px] disabled:opacity-40"
                  style={{ background: t.btnBg, color: t.btnText }}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setAddingTab(false);
                    setNewTabLabel("");
                  }}
                  className="px-2 py-1.5 rounded-lg text-[12px]"
                  style={{ border: `1px solid ${t.border}`, color: t.textSub }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {navSections.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => scrollTo(key)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all"
              style={{
                background: activeSection === key ? t.surface : 'transparent',
                color: activeSection === key ? t.text : t.textSub,
                fontWeight: activeSection === key ? 500 : 400,
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-10 pt-10">

        <Section id="schedule" label="Schedule" t={t}>
          <CalendarView
            eventId={id as string}
            blocks={blocks}
            days={days}
            theme={theme}
            onBlocksChange={setBlocks}
            onDaysChange={setDays}
          />
        </Section>

        {/* ── GROUPS ── */}
        <Section id="groups" label="Groups" t={t}>
          <div className="flex items-center justify-between mb-6">
            <p className="text-[14px]" style={{ color: t.textSub }}>
              {groups.length} group{groups.length !== 1 ? 's' : ''} · {groups.reduce((a, g) => a + g.members.length, 0)} members total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCsvMode(false); setCsvText(""); setCsvParsed([]); setCsvError(""); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
                style={{
                  background: !csvMode ? t.surface : 'transparent',
                  color: !csvMode ? t.text : t.textSub,
                  border: `1px solid ${!csvMode ? t.border : 'transparent'}`,
                  fontWeight: !csvMode ? 500 : 400,
                }}
              >
                <UserPlus size={12} /> Manual
              </button>
              <button
                onClick={() => setCsvMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
                style={{
                  background: csvMode ? t.surface : 'transparent',
                  color: csvMode ? t.text : t.textSub,
                  border: `1px solid ${csvMode ? t.border : 'transparent'}`,
                  fontWeight: csvMode ? 500 : 400,
                }}
              >
                <Upload size={12} /> CSV import
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {csvMode ? (
              <motion.div
                key="csv"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 mb-6"
              >
                {/* Format guide */}
                <div
                  className="p-4 rounded-xl flex flex-col gap-2"
                  style={{ background: t.surface, border: `1px solid ${t.border}` }}
                >
                  <p className="text-[12px] font-medium uppercase tracking-widest" style={{ color: t.textFaint }}>
                    Format
                  </p>
                  <div className="flex flex-col gap-1">
                    {[
                      { label: "Group + member", example: "Group A, Alice Smith" },
                      { label: "Multiple members", example: "Group A, Alice, Bob, Carol" },
                      { label: "No group", example: "John Doe  (goes to Ungrouped)" },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-3">
                        <span className="text-[11px] w-32 shrink-0" style={{ color: t.textFaint }}>{row.label}</span>
                        <code className="text-[11px]" style={{ color: t.textSub }}>{row.example}</code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paste area */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium" style={{ color: t.textSub }}>
                    Paste CSV data
                  </label>
                  <textarea
                    value={csvText}
                    onChange={e => handleCsvChange(e.target.value)}
                    placeholder={`Group A, Alice Smith\nGroup A, Bob Jones\nGroup B, Carol White\nGroup B, David Kim`}
                    rows={8}
                    className="w-full rounded-xl outline-none resize-none text-[13px] font-mono"
                    style={{
                      background: t.inputBg,
                      border: `1px solid ${csvError ? "#ef4444" : t.border}`,
                      color: t.text,
                      padding: "12px",
                      lineHeight: "1.8",
                    }}
                  />
                  {csvError && (
                    <p className="text-[12px]" style={{ color: "#ef4444" }}>{csvError}</p>
                  )}
                </div>

                {/* Preview */}
                <AnimatePresence>
                  {csvParsed.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="p-4 rounded-xl flex flex-col gap-3"
                        style={{ background: t.surface, border: `1px solid ${t.border}` }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] font-medium uppercase tracking-widest" style={{ color: t.textFaint }}>
                            Preview
                          </p>
                          <p className="text-[12px]" style={{ color: t.textFaint }}>
                            {csvParsed.length} group{csvParsed.length !== 1 ? 's' : ''} · {csvParsed.reduce((a, g) => a + g.members.length, 0)} members
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                          {csvParsed.map((g, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <span
                                className="text-[12px] font-medium shrink-0 w-32 truncate"
                                style={{ color: t.text }}
                              >
                                {g.group}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {g.members.map((m, j) => (
                                  <span
                                    key={j}
                                    className="text-[11px] px-2 py-0.5 rounded-full"
                                    style={{ background: t.border, color: t.textSub }}
                                  >
                                    {m}
                                  </span>
                                ))}
                                {g.members.length === 0 && (
                                  <span className="text-[11px]" style={{ color: t.textFaint }}>No members</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleImportCSV}
                    disabled={importingCsv || csvParsed.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium disabled:opacity-40"
                    style={{ background: t.btnBg, color: t.btnText }}
                  >
                    <FileText size={14} />
                    {importingCsv ? "Importing..." : `Import ${csvParsed.length > 0 ? `${csvParsed.length} group${csvParsed.length !== 1 ? 's' : ''}` : ""}`}
                  </motion.button>
                  <button
                    onClick={() => { setCsvMode(false); setCsvText(""); setCsvParsed([]); setCsvError(""); }}
                    className="px-4 py-2.5 rounded-xl text-[13px] transition-opacity hover:opacity-70"
                    style={{ color: t.textSub, border: `1px solid ${t.border}` }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleAddGroup} className="flex gap-3 mb-6">
                  <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
                    placeholder="New group name" style={{ ...inputStyle(t), flex: 1 }} />
                  <motion.button type="submit" disabled={savingGroup || !groupName.trim()} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium disabled:opacity-40 shrink-0"
                    style={{ background: t.btnBg, color: t.btnText }}>
                    <Plus size={14} /> Add group
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Group list — always visible */}
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {groups.length === 0 && (
                <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[14px] text-center py-10" style={{ color: t.textFaint }}>No groups yet</motion.p>
              )}
              {groups.map((group, i) => {
                const isOpen = openGroup === group.id
                return (
                  <motion.div key={group.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ delay: i * 0.03 }}
                    className="rounded-xl overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <button onClick={() => setOpenGroup(isOpen ? null : group.id)}
                        className="flex items-center gap-3 flex-1 text-left">
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={14} style={{ color: t.textFaint }} />
                        </motion.div>
                        <span className="text-[14px] font-medium" style={{ color: t.text }}>{group.name}</span>
                        <span className="text-[12px]" style={{ color: t.textFaint }}>{group.members.length} members</span>
                      </button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteGroup(group.id)}
                        className="p-1.5 rounded-lg" style={{ color: t.textFaint }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}>
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 py-3" style={{ borderTop: `1px solid ${t.border}`, background: t.surface }}>
                            <div className="flex flex-col gap-2 mb-4">
                              {group.members.length === 0 && (
                                <p className="text-[12px]" style={{ color: t.textFaint }}>No members yet</p>
                              )}
                              <AnimatePresence>
                                {group.members.map(member => (
                                  <motion.div key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }} className="flex items-center justify-between">
                                    <span className="text-[13px]" style={{ color: t.textSub }}>{member.name}</span>
                                    <button onClick={() => handleDeleteMember(group.id, member.id)}
                                      className="text-[12px] px-2 py-0.5 rounded" style={{ color: t.textFaint }}
                                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                                      onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}>
                                      Remove
                                    </button>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                            <form onSubmit={e => handleAddMember(e, group.id)} className="flex gap-2">
                              <input type="text" value={memberName} onChange={e => setMemberName(e.target.value)}
                                placeholder="Member name" style={{ ...inputStyle(t), flex: 1 }} />
                              <motion.button type="submit" disabled={savingGroup || !memberName.trim()} whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium disabled:opacity-40 shrink-0"
                                style={{ background: t.btnBg, color: t.btnText }}>
                                <UserPlus size={12} /> Add
                              </motion.button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </Section>

        {/* ── ANNOUNCEMENTS ── */}
        <Section id="announcements" label="Announcements" t={t}>
          <p className="text-[14px] mb-6" style={{ color: t.textSub }}>{announcements.length} posted</p>
          <form onSubmit={handlePostAnn} className="flex flex-col gap-3 mb-6">
            <textarea value={annBody} onChange={e => setAnnBody(e.target.value)}
              placeholder="Write an announcement for your attendees..." rows={3}
              className="w-full rounded-xl outline-none resize-none text-[14px]"
              style={{ background: t.inputBg, border: `1px solid ${t.border}`, color: t.text, padding: "12px", lineHeight: "1.6" }} />
            <div className="flex justify-end">
              <motion.button type="submit" disabled={savingAnn || !annBody.trim()} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium disabled:opacity-40"
                style={{ background: t.btnBg, color: t.btnText }}>
                <Send size={13} /> {savingAnn ? "Posting..." : "Post"}
              </motion.button>
            </div>
          </form>
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {announcements.length === 0 && (
                <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[14px] text-center py-10" style={{ color: t.textFaint }}>No announcements yet</motion.p>
              )}
              {announcements.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ delay: i * 0.03 }}
                  className="px-4 py-3 rounded-xl" style={{ border: `1px solid ${t.border}` }}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[14px] leading-relaxed" style={{ color: t.text }}>{a.body}</p>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteAnn(a.id)}
                      className="shrink-0 p-1.5 rounded-lg" style={{ color: t.textFaint }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}>
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: t.textFaint }}>
                    {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Section>

        {/* ── LINKS ── */}
        <Section id="links" label="Links" t={t}>
          <p className="text-[14px] mb-6" style={{ color: t.textSub }}>{links.length} link{links.length !== 1 ? 's' : ''}</p>
          <form onSubmit={handleAddLink} className="flex flex-col gap-3 p-5 rounded-2xl mb-6"
            style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label style={lbl}>Label</label>
                <input type="text" value={linkLabel} onChange={e => setLinkLabel(e.target.value)}
                  placeholder="e.g. Spotify Playlist" style={inputStyle(t)} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label style={lbl}>URL</label>
                <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://..." style={inputStyle(t)} />
              </div>
            </div>
            <div className="flex justify-end">
              <motion.button type="submit" disabled={savingLink || !linkLabel || !linkUrl} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium disabled:opacity-40"
                style={{ background: t.btnBg, color: t.btnText }}>
                <Plus size={13} /> {savingLink ? "Adding..." : "Add link"}
              </motion.button>
            </div>
          </form>
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {links.length === 0 && (
                <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[14px] text-center py-10" style={{ color: t.textFaint }}>No links yet</motion.p>
              )}
              {links.map((link, i) => (
                <motion.div key={link.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl gap-4"
                  style={{ border: `1px solid ${t.border}` }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium" style={{ color: t.text }}>{link.label}</p>
                    <p className="text-[12px] mt-0.5 truncate" style={{ color: t.textFaint }}>{link.url}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={link.url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg" style={{ color: t.textFaint }}
                      onMouseEnter={e => (e.currentTarget.style.color = t.text)}
                      onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}>
                      <ExternalLink size={14} />
                    </a>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteLink(link.id)}
                      className="p-1.5 rounded-lg" style={{ color: t.textFaint }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}>
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Section>

        {/* ── DESIGN ── */}
        <Section id="design" label="Design" t={t}>
          <div className="flex flex-col gap-10">
            <div>
              <p className="text-[12px] uppercase tracking-widest font-medium mb-4" style={{ color: t.textFaint }}>Primary color</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {PRESET_COLORS.map(color => (
                  <motion.button key={color} whileTap={{ scale: 0.9 }}
                    onClick={() => setDesign(d => ({ ...d, primary_color: color }))}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: color, outline: design.primary_color === color ? `2px solid ${color}` : 'none', outlineOffset: '3px' }}>
                    {design.primary_color === color && <Check size={13} color="#fff" />}
                  </motion.button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={design.primary_color}
                  onChange={e => setDesign(d => ({ ...d, primary_color: e.target.value }))}
                  className="w-8 h-8 rounded-lg cursor-pointer"
                  style={{ border: `1px solid ${t.border}`, padding: "2px" }} />
                <span className="text-[13px] font-mono" style={{ color: t.textSub }}>{design.primary_color}</span>
              </div>
            </div>

            <div>
              <p className="text-[12px] uppercase tracking-widest font-medium mb-4" style={{ color: t.textFaint }}>Attendee theme</p>
              <div className="flex gap-2">
                {(['light', 'dark'] as const).map(th => (
                  <motion.button key={th} whileTap={{ scale: 0.97 }}
                    onClick={() => setDesign(d => ({ ...d, theme: th }))}
                    className="flex-1 py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: design.theme === th ? (th === 'dark' ? '#1a1a1a' : '#ffffff') : t.surface,
                      color: design.theme === th ? (th === 'dark' ? '#f0f0f0' : '#1a1a1a') : t.textFaint,
                      border: `1px solid ${design.theme === th ? (th === 'dark' ? '#333' : '#e0e0e0') : t.border}`,
                    }}>
                    {design.theme === th && <Check size={12} />}
                    {th === 'light' ? 'Light' : 'Dark'}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] uppercase tracking-widest font-medium mb-4" style={{ color: t.textFaint }}>Font</p>
              <div className="flex gap-2">
                {FONTS.map(f => (
                  <motion.button key={f.value} whileTap={{ scale: 0.97 }}
                    onClick={() => setDesign(d => ({ ...d, font: f.value }))}
                    className="flex-1 py-3 rounded-xl text-[12px] flex flex-col items-center gap-1 transition-all"
                    style={{
                      background: design.font === f.value ? t.btnBg : t.surface,
                      color: design.font === f.value ? t.btnText : t.textSub,
                      border: `1px solid ${design.font === f.value ? 'transparent' : t.border}`,
                      fontFamily: f.value === 'serif' ? 'Georgia, serif' : f.value === 'mono' ? 'monospace' : 'inherit',
                    }}>
                    <span className="text-[18px]">{f.sample}</span>
                    <span className="text-[10px] uppercase tracking-widest">{f.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] uppercase tracking-widest font-medium" style={{ color: t.textFaint }}>Tabs</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAddingTab(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium hover:opacity-70 transition-opacity"
                  style={{ background: t.surface, color: t.textSub, border: `1px solid ${t.border}` }}>
                  <Plus size={12} /> Add tab
                </motion.button>
              </div>
              <AnimatePresence>
                {addingTab && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                      style={{ border: `1.5px solid ${t.btnBg}`, background: t.surface }}>
                      <input type="text" value={newTabLabel} onChange={e => setNewTabLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addCustomTab(); if (e.key === 'Escape') { setAddingTab(false); setNewTabLabel("") } }}
                        placeholder="Tab name..." autoFocus
                        className="flex-1 text-[13px] bg-transparent outline-none" style={{ color: t.text }} />
                      <motion.button whileTap={{ scale: 0.95 }} onClick={addCustomTab} disabled={!newTabLabel.trim()}
                        className="px-3 py-1 rounded-lg text-[12px] font-medium disabled:opacity-40"
                        style={{ background: t.btnBg, color: t.btnText }}>Add</motion.button>
                      <button onClick={() => { setAddingTab(false); setNewTabLabel("") }}
                        className="p-1 rounded hover:opacity-60" style={{ color: t.textFaint }}>
                        <X size={13} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <Reorder.Group axis="y" values={design.tabs}
                onReorder={tabs => setDesign(d => ({ ...d, tabs }))}
                className="flex flex-col gap-2">
                <AnimatePresence>
                  {design.tabs.map(tab => {
                    const isBuiltin = BUILTIN_KEYS.includes(tab.key)
                    return (
                      <Reorder.Item key={tab.key} value={tab}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-grab active:cursor-grabbing"
                        style={{ border: `1px solid ${t.border}`, background: t.surface, listStyle: 'none' }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        whileDrag={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 10 }}>
                        <GripVertical size={14} style={{ color: t.textFaint }} />
                        <button onClick={() => updateTab(tab.key, 'visible', !tab.visible)}
                          className="shrink-0 w-8 h-4 rounded-full relative transition-all"
                          style={{ background: tab.visible ? t.btnBg : t.border }}>
                          <motion.span animate={{ left: tab.visible ? '16px' : '2px' }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-0.5 w-3 h-3 rounded-full"
                            style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                        </button>
                        <input type="text" value={tab.label} onChange={e => updateTab(tab.key, 'label', e.target.value)}
                          disabled={!tab.visible} className="flex-1 text-[13px] bg-transparent outline-none"
                          style={{ color: tab.visible ? t.text : t.textFaint }} />
                        {isBuiltin ? (
                          <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded"
                            style={{ color: t.textFaint, background: t.border }}>{tab.key}</span>
                        ) : (
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteTab(tab.key)}
                            className="p-1 rounded" style={{ color: t.textFaint }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                            onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}>
                            <Trash2 size={13} />
                          </motion.button>
                        )}
                      </Reorder.Item>
                    )
                  })}
                </AnimatePresence>
              </Reorder.Group>
              <p className="text-[11px] mt-2" style={{ color: t.textFaint }}>
                Drag to reorder · Built-in tabs can be hidden but not deleted
              </p>
            </div>

            <motion.button whileTap={{ scale: 0.98 }} onClick={handleSaveDesign} disabled={savingDesign}
              className="w-full py-3 rounded-xl text-[14px] font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: t.btnBg, color: t.btnText }}>
              <AnimatePresence mode="wait">
                {designSaved ? (
                  <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2"><Check size={15} /> Saved</motion.span>
                ) : (
                  <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {savingDesign ? "Saving..." : "Save design"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </Section>
        {/* ── CUSTOM TAB SECTIONS ── */}
        {design.tabs
          .filter(tab => !BUILTIN_KEYS.includes(tab.key) && tab.visible)
          .map(tab => (
            <Section key={tab.key} id={tab.key} label={tab.label} t={t}>
              <BlockEditor
                blocks={tabContent[tab.key] ?? []}
                onChange={blocks => setTabContent(prev => ({ ...prev, [tab.key]: blocks }))}
                t={t}
                isDark={theme === "dark"}
              />
              <div className="flex justify-end mt-6">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSaveTabContent(tab.key)}
                  disabled={savingContent === tab.key}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
                  style={{ background: t.btnBg, color: t.btnText }}
                >
                  <AnimatePresence mode="wait">
                    {savedContent === tab.key ? (
                      <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2">
                        <Check size={14} /> Saved
                      </motion.span>
                    ) : (
                      <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {savingContent === tab.key ? "Saving..." : `Save ${tab.label}`}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </Section>
          ))
        }
        <div className="h-24" />
      </div>
    </motion.div>
  )
}