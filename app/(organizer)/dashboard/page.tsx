"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme, tokens } from "../../../lib/theme/theme-context";
import { Plus, Calendar, ArrowRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cacheGet, cacheSet } from "@/lib/cache";
import EventEditor from "@/components/organizer/EventEditor";

type Event = {
  id: string; slug: string; title: string;
  tagline: string; access_code: string; created_at: string;
  primary_color: string;
}
type Stats = { totalAttendees: number; totalEvents: number; totalGroups: number; }
type Profile = { full_name: string | null; organization: string | null; }
type DashCache = { events: Event[]; stats: Stats; profile: Profile | null; }

const CACHE_KEY = "prelude:dashboard";

export default function DashboardPage() {
  const [events, setEvents]   = useState<Event[]>([]);
  const [stats, setStats]     = useState<Stats>({ totalAttendees: 0, totalEvents: 0, totalGroups: 0 });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale]     = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const router   = useRouter();
  const supabase = createClient();
  const { theme } = useTheme();
  const t = tokens(theme);

  useEffect(() => {
    // 1. Show cache instantly
    const cached = cacheGet<DashCache>(CACHE_KEY);
    if (cached) {
      setEvents(cached.events);
      setStats(cached.stats);
      setProfile(cached.profile);
      setLoading(false);
      setStale(true);
    }

    // 2. Always fetch fresh
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }

      const [
        { data: eventsData },
        { count: memberCount },
        { count: groupCount },
        { data: profileData },
      ] = await Promise.all([
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('groups').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('full_name, organization').eq('id', user.id).single(),
      ])

      const freshStats = {
        totalEvents:    eventsData?.length ?? 0,
        totalAttendees: memberCount ?? 0,
        totalGroups:    groupCount ?? 0,
      }

      setEvents(eventsData ?? []);
      setStats(freshStats);
      setProfile(profileData);
      setLoading(false);
      setStale(false);

      cacheSet<DashCache>(CACHE_KEY, {
        events:  eventsData ?? [],
        stats:   freshStats,
        profile: profileData,
      });
    }

    load();
  }, [])

  async function handleDelete(eventId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this event? This cannot be undone.')) return;
    await supabase.from('events').delete().eq('id', eventId);
    const updated = events.filter(ev => ev.id !== eventId);
    const updatedStats = { ...stats, totalEvents: stats.totalEvents - 1 };
    setEvents(updated);
    setStats(updatedStats);
    cacheSet<DashCache>(CACHE_KEY, { events: updated, stats: updatedStats, profile });
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  if (loading) return (
    <div className="flex h-full items-center justify-center text-[15px]" style={{ color: t.textSub }}>
      Loading...
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="px-12 py-12 max-w-5xl"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="flex items-start justify-between mb-10"
      >
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight leading-none mb-2" style={{ color: t.text }}>
            {profile?.full_name ? `${greeting}, ${profile.full_name.split(" ")[0]}` : "Overview"}
          </h1>
          <p className="text-[15px]" style={{ color: t.textSub }}>
            {profile?.organization ?? "Welcome back"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/dashboard/lab/blocknote")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-[14px] font-medium hover:opacity-80 transition-opacity"
            style={{ border: `1px solid ${t.border}`, color: t.textSub }}
          >
            Try BlockNote
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/dashboard/new")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-[15px] font-medium hover:opacity-80 transition-opacity"
            style={{ background: t.btnBg, color: t.btnText }}
          >
            <Plus size={16} /> New event
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-3 gap-px mb-10 rounded-2xl overflow-hidden"
        style={{ background: t.border }}
      >
        {[
          { label: "Total events",    value: stats.totalEvents    },
          { label: "Total attendees", value: stats.totalAttendees },
          { label: "Total groups",    value: stats.totalGroups    },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.05, duration: 0.4 }}
            className="px-8 py-6"
            style={{ background: t.surface }}
          >
            <p className="text-[12px] uppercase tracking-widest mb-3" style={{ color: t.textFaint }}>{stat.label}</p>
            <p className="text-[36px] font-semibold tracking-tight leading-none" style={{ color: t.text }}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Stale indicator */}
      <AnimatePresence>
        {stale && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 mb-4 text-[12px]"
            style={{ color: t.textFaint }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.textFaint }} />
            Refreshing...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] uppercase tracking-widest font-medium" style={{ color: t.textFaint }}>Events</p>
          <p className="text-[13px]" style={{ color: t.textFaint }}>{events.length} total</p>
        </div>

        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
            className="flex flex-col items-center justify-center py-40 rounded-2xl text-center"
            style={{ border: `1px dashed ${t.border}` }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: t.surface }}>
              <Calendar size={24} style={{ color: t.textFaint }} />
            </div>
            <p className="text-[18px] font-medium mb-2" style={{ color: t.text }}>No events yet</p>
            <p className="text-[15px] mb-8" style={{ color: t.textSub }}>Create your first event and share it with attendees</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/dashboard/new")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-[15px] font-medium hover:opacity-80 transition-opacity"
              style={{ background: t.btnBg, color: t.btnText }}
            >
              <Plus size={16} /> Create event
            </motion.button>
          </motion.div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
            <AnimatePresence>
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => router.push(`/dashboard/${event.id}`)}
                  className="group flex items-center justify-between px-6 py-5 cursor-pointer"
                  style={{
                    borderBottom: i < events.length - 1 ? `1px solid ${t.border}` : "none",
                    background: t.bg,
                  }}
                  whileHover={{ background: t.surface }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: event.primary_color ?? t.textFaint }} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium truncate" style={{ color: t.text }}>{event.title}</p>
                      {event.tagline && (
                        <p className="text-[13px] mt-0.5 truncate" style={{ color: t.textSub }}>{event.tagline}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-8 shrink-0 ml-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: t.textFaint }}>Slug</p>
                      <p className="text-[13px] font-mono" style={{ color: t.textSub }}>/e/{event.slug}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: t.textFaint }}>Code</p>
                      <p className="text-[13px] font-mono tracking-widest" style={{ color: t.textSub }}>{event.access_code}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: t.textFaint }}>Created</p>
                      <p className="text-[13px]" style={{ color: t.textSub }}>
                        {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={e => handleDelete(event.id, e)}
                        whileTap={{ scale: 0.95 }}
                        className="opacity-0 group-hover:opacity-100 text-[13px] px-3 py-1.5 rounded-lg transition-all"
                        style={{ color: t.danger, background: "rgba(239,68,68,0.08)" }}
                      >
                        Delete
                      </motion.button>
                      <ArrowRight size={16} style={{ color: t.textFaint }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}