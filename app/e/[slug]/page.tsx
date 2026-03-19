"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-client";
import { useParams } from "next/navigation";
import ScheduleTab from "../../components/tabs/ScheduleTab";
import GroupsTab from "../../components/tabs/GroupsTab";

type Event = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  access_code: string;
  primary_color: string;
  theme: string;
  font: string;
  tabs: { key: string; label: string; visible: boolean }[];
}

type Announcement = {
  id: string;
  body: string;
  created_at: string;
}

type Link = {
  id: string;
  label: string;
  url: string;
}

type Tab = "schedule" | "groups" | "announcements" | "links"

export default function EventPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("schedule");
  const { slug } = useParams();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setEvent(data)
      setLoading(false)
    }
    load()
  }, [])

  // Load announcements + links once authenticated
  useEffect(() => {
    if (!authenticated || !event) return
    async function loadContent() {
      const [{ data: ann }, { data: lnk }] = await Promise.all([
        supabase.from('announcements').select('*').eq('event_id', event!.id).order('created_at', { ascending: false }),
        supabase.from('links').select('*').eq('event_id', event!.id).order('position'),
      ])
      setAnnouncements(ann ?? [])
      setLinks(lnk ?? [])
    }
    loadContent()
  }, [authenticated, event])

  function handleAccessCode(e: React.FormEvent) {
    e.preventDefault()
    if (!event) return
    if (accessCode.toUpperCase() === event.access_code.toUpperCase()) {
      setAuthenticated(true)
      setError("")
    } else {
      setError("Incorrect code. Try again.")
      setAccessCode("")
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-sm text-brown/40">
      Loading...
    </div>
  )

  if (notFound) return (
    <div className="flex h-screen items-center justify-center text-sm text-brown/40">
      Event not found.
    </div>
  )

  if (!event) return null

  // Access code gate
  if (!authenticated) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-[32px] font-medium tracking-tight text-brown leading-none mb-1">
            {event.title}
          </h1>
          {event.tagline && (
            <p className="text-sm text-brown/40">{event.tagline}</p>
          )}
        </div>
        <form onSubmit={handleAccessCode} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-widest text-brown/40">
              Access code
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter your code"
              className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25 font-mono tracking-widest uppercase"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={!accessCode.trim()}
            className="w-full py-2.5 bg-brown text-paper text-sm font-medium rounded-lg hover:bg-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enter →
          </button>
        </form>
      </div>
    </div>
  )

  // Main event app
  // Main event app
  const fontFamily = event.font === 'serif'
    ? 'Georgia, serif'
    : event.font === 'mono'
      ? 'monospace'
      : 'inherit'

  const visibleTabs = event.tabs.filter((t) => t.visible)

  return (
    <div
      className="max-w-lg mx-auto min-h-screen relative"
      style={{
        '--primary': event.primary_color,
        '--bg': event.theme === 'dark' ? '#1a1a1a' : '#f5f0eb',
        '--text': event.theme === 'dark' ? '#f5f0eb' : '#2c1a0e',
        fontFamily,
        background: event.theme === 'dark' ? '#1a1a1a' : '#f5f0eb',
        color: event.theme === 'dark' ? '#f5f0eb' : '#2c1a0e',
      } as React.CSSProperties}
    >
      <main>
        {tab === "schedule" && (
          <ScheduleTab eventId={event.id} primaryColor={event.primary_color} theme={event.theme} />
        )}
        {tab === "groups" && (
          <GroupsTab eventId={event.id} primaryColor={event.primary_color} theme={event.theme} />
        )}
        {tab === "announcements" && (
          <div className="px-6 pt-12 pb-28">
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text)', opacity: 0.3 }}>Event</p>
            <h2 className="text-[28px] font-medium tracking-tight mb-6" style={{ color: 'var(--text)' }}>
              {visibleTabs.find(t => t.key === 'announcements')?.label ?? 'Updates'}
            </h2>
            {announcements.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text)', opacity: 0.3 }}>No announcements yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {announcements.map((a) => (
                  <div key={a.id} className="border rounded-xl px-4 py-3" style={{ borderColor: 'var(--text)', opacity: 0.1 }}>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text)' }}>{a.body}</p>
                    <p className="text-[10px] mt-2" style={{ color: 'var(--text)', opacity: 0.4 }}>{formatDate(a.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "links" && (
          <div className="px-6 pt-12 pb-28">
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text)', opacity: 0.3 }}>Event</p>
            <h2 className="text-[28px] font-medium tracking-tight mb-6" style={{ color: 'var(--text)' }}>
              {visibleTabs.find(t => t.key === 'links')?.label ?? 'Links'}
            </h2>
            {links.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text)', opacity: 0.3 }}>No links yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors"
                    style={{ border: `1px solid ${event.primary_color}`, color: 'var(--text)' }}
                  >
                    <span className="text-[13px] font-medium">{link.label}</span>
                    <span style={{ color: event.primary_color }}>→</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto border-t backdrop-blur-sm px-6 py-3 flex justify-around"
        style={{
          borderColor: event.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(44,26,14,0.1)',
          background: event.theme === 'dark' ? 'rgba(26,26,26,0.95)' : 'rgba(245,240,235,0.95)',
        }}
      >
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className="flex flex-col items-center gap-1 transition-colors"
          >
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{
                color: tab === t.key ? event.primary_color : event.theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(44,26,14,0.3)',
                fontWeight: tab === t.key ? 600 : 400,
              }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}