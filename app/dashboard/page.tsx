"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase-client";
import { useRouter } from "next/navigation";

type Event = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  access_code: string;
  created_at: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }

      // Fetch events
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) { console.error(error); return; }
      setEvents(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/dashboard/login");
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-sm text-brown/40">
      Loading...
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-brown/30 mb-1">
            Organizer Portal
          </p>
          <h1 className="text-[32px] font-medium tracking-tight text-brown leading-none">
            My Events
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-brown/30 hover:text-brown/60 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Create new event button */}
      <button
        onClick={() => router.push("/dashboard/new")}
        className="w-full py-3 border border-dashed border-brown/20 rounded-xl text-sm text-brown/40 hover:border-brown/40 hover:text-brown/60 transition-colors mb-6"
      >
        + Create new event
      </button>

      {/* Events list */}
      {events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-brown/30">No events yet. Create your first one!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="border border-brown/10 rounded-xl px-5 py-4 hover:border-brown/25 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-medium text-brown truncate">
                    {event.title}
                  </h2>
                  {event.tagline && (
                    <p className="text-[12px] text-brown/40 mt-0.5 truncate">
                      {event.tagline}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-brown/30">
                      /{event.slug}
                    </span>
                    <span className="text-[10px] text-brown/30">
                      Code: {event.access_code}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/${event.id}`)}
                  className="shrink-0 text-xs px-3 py-1.5 border border-brown/15 rounded-lg text-brown/50 hover:border-brown/30 hover:text-brown/70 transition-colors"
                >
                  Edit →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}