"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";
import { useTheme, tokens } from "../theme-context";
import { Calendar, Users, Megaphone, Link, Palette, ExternalLink, Copy, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

type Event = {
  id: string; slug: string; title: string;
  tagline: string; access_code: string; primary_color: string;
}

export default function EventDashboardPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();
  const { theme } = useTheme();
  const t = tokens(theme);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single()
      if (error) { console.error(error); return; }
      setEvent(data); setLoading(false)
    }
    load()
  }, [])

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/e/${event?.slug}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center text-[15px]" style={{ color: t.textSub }}>Loading...</div>
  )
  if (!event) return null

  const sections = [
    { label: "Schedule", desc: "Add and edit schedule blocks", href: `/dashboard/${id}/schedule`, icon: Calendar },
    { label: "Groups", desc: "Manage groups and members", href: `/dashboard/${id}/groups`, icon: Users },
    { label: "Announcements", desc: "Post updates to attendees", href: `/dashboard/${id}/announcements`, icon: Megaphone },
    { label: "Links", desc: "Add useful links for your event", href: `/dashboard/${id}/links`, icon: Link },
    { label: "Design", desc: "Customize colors, fonts, tabs", href: `/dashboard/${id}/design`, icon: Palette },
  ]

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
        <div className="flex items-start gap-4">
          <div className="w-5 h-5 rounded-full mt-2 shrink-0" style={{ background: event.primary_color }} />
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight leading-none mb-2" style={{ color: t.text }}>
              {event.title}
            </h1>
            {event.tagline && <p className="text-[16px]" style={{ color: t.textSub }}>{event.tagline}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <motion.a
            whileTap={{ scale: 0.97 }}
            href={`/e/${event.slug}`} target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 text-[14px] rounded-xl hover:opacity-70 transition-opacity"
            style={{ border: `1px solid ${t.border}`, color: t.textSub }}
          >
            <ExternalLink size={14} /> Preview
          </motion.a>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium rounded-xl hover:opacity-80 transition-opacity"
            style={{ background: t.btnBg, color: t.btnText }}
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Copy link"}
          </motion.button>
        </div>
      </motion.div>

      {/* Meta strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-3 gap-px mb-10 rounded-2xl overflow-hidden"
        style={{ background: t.border }}
      >
        {[
          { label: "Attendee link", value: `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${event.slug}`, mono: true },
          { label: "Access code", value: event.access_code, mono: true },
          { label: "Color", value: event.primary_color, mono: true, color: event.primary_color },
        ].map((item, i) => (
          <div key={i} className="px-6 py-5" style={{ background: t.surface }}>
            <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: t.textFaint }}>{item.label}</p>
            <div className="flex items-center gap-2">
              {item.color && <div className="w-4 h-4 rounded-full shrink-0" style={{ background: item.color }} />}
              <p className={`text-[15px] ${item.mono ? 'font-mono' : ''} truncate`} style={{ color: t.text }}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Section grid */}
      <div className="grid grid-cols-3 gap-3">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.button
              key={section.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => router.push(section.href)}
              className="p-6 rounded-2xl text-left flex flex-col gap-5 group"
              style={{ border: `1px solid ${t.border}`, background: t.bg }} // ← t.bg not "transparent"
              whileHover={{ background: t.surface, borderColor: t.borderHover }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: t.surface }}>
                  <Icon size={18} style={{ color: t.textSub }} />
                </div>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: t.textFaint }} />
              </div>
              <div>
                <p className="text-[16px] font-medium mb-1" style={{ color: t.text }}>{section.label}</p>
                <p className="text-[13px] leading-relaxed" style={{ color: t.textFaint }}>{section.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  )
}