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
  const [event, setEvent]               = useState<Event | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [links, setLinks]               = useState<Link[]>([]);
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);
  const [accessCode, setAccessCode]     = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError]               = useState("");
  const [tab, setTab]                   = useState<Tab>("schedule");
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
  return (
    <div className="max-w-lg mx-auto min-h-screen relative">
      <main>
        {tab === "schedule" && <ScheduleTab eventId={event.id} />}
        {tab === "groups" && <GroupsTab eventId={event.id} />}

        {tab === "announcements" && (
          <div className="px-6 pt-12 pb-28">
            <p className="text-[10px] tracking-widest uppercase text-brown/30 mb-1">Event</p>
            <h2 className="text-[28px] font-medium tracking-tight text-brown mb-6">Updates</h2>
            {announcements.length === 0 ? (
              <p className="text-sm text-brown/30">No announcements yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {announcements.map((a) => (
                  <div key={a.id} className="border border-brown/10 rounded-xl px-4 py-3">
                    <p className="text-[13px] text-brown leading-relaxed">{a.body}</p>
                    <p className="text-[10px] text-brown/30 mt-2">{formatDate(a.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "links" && (
          <div className="px-6 pt-12 pb-28">
            <p className="text-[10px] tracking-widest uppercase text-brown/30 mb-1">Event</p>
            <h2 className="text-[28px] font-medium tracking-tight text-brown mb-6">Links</h2>
            {links.length === 0 ? (
              <p className="text-sm text-brown/30">No links yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between border border-brown/10 rounded-xl px-4 py-3 hover:border-brown/25 transition-colors"
                  >
                    <span className="text-[13px] font-medium text-brown">{link.label}</span>
                    <span className="text-brown/30 text-sm">→</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto border-t border-brown/10 bg-paper/95 backdrop-blur-sm px-6 py-3 flex justify-around">
        {(["schedule", "groups", "announcements", "links"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex flex-col items-center gap-1 transition-colors"
          >
            <span className={`text-[10px] uppercase tracking-widest capitalize ${tab === t ? "text-brown font-medium" : "text-brown/30"}`}>
              {t}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}