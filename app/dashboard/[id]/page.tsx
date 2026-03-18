"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";

type Event = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  access_code: string;
  primary_color: string;
}

export default function EventDashboardPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) { console.error(error); return; }
      setEvent(data)
      setLoading(false)
    }
    load()
  }, [])

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/e/${event?.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-sm text-brown/40">
      Loading...
    </div>
  )

  if (!event) return (
    <div className="flex h-screen items-center justify-center text-sm text-brown/40">
      Event not found
    </div>
  )

  const sections = [
    { label: "Schedule",      description: "Add and edit schedule blocks",     href: `/dashboard/${id}/schedule` },
    { label: "Groups",        description: "Manage groups and members",         href: `/dashboard/${id}/groups` },
    { label: "Announcements", description: "Post updates to attendees",         href: `/dashboard/${id}/announcements` },
    { label: "Links",         description: "Add useful links for your event",   href: `/dashboard/${id}/links` },
  ]

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-brown/30 hover:text-brown/60 transition-colors mb-6 block"
        >
          ← All events
        </button>
        <p className="text-[10px] tracking-widest uppercase text-brown/30 mb-1">
          Event
        </p>
        <h1 className="text-[32px] font-medium tracking-tight text-brown leading-none mb-1">
          {event.title}
        </h1>
        {event.tagline && (
          <p className="text-sm text-brown/40">{event.tagline}</p>
        )}
      </div>

      {/* Event info card */}
      <div className="border border-brown/10 rounded-xl px-5 py-4 mb-8 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brown/30 mb-1">
              Attendee link
            </p>
            <p className="text-sm text-brown font-mono">
              /e/{event.slug}
            </p>
          </div>
          <button
            onClick={copyLink}
            className="text-xs px-3 py-1.5 border border-brown/15 rounded-lg text-brown/50 hover:border-brown/30 transition-colors"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <div className="h-px bg-brown/8" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brown/30 mb-1">
            Access code
          </p>
          <p className="text-sm text-brown font-mono tracking-widest">
            {event.access_code}
          </p>
        </div>
      </div>

      {/* Section editors */}
      <div className="flex flex-col gap-3">
        {sections.map((section) => (
          <button
            key={section.label}
            onClick={() => router.push(section.href)}
            className="w-full border border-brown/10 rounded-xl px-5 py-4 hover:border-brown/25 transition-colors text-left flex items-center justify-between"
          >
            <div>
              <p className="text-[14px] font-medium text-brown">
                {section.label}
              </p>
              <p className="text-[11px] text-brown/35 mt-0.5">
                {section.description}
              </p>
            </div>
            <span className="text-brown/25 text-sm">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}