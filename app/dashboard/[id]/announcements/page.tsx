"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";

type Announcement = {
  id: string;
  body: string;
  created_at: string;
}

export default function AnnouncementsEditorPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false })

      if (error) { console.error(error); return; }
      setAnnouncements(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSaving(true)

    const { data, error } = await supabase
      .from('announcements')
      .insert({ event_id: id, body })
      .select()
      .single()

    if (error) { console.error(error); setSaving(false); return; }
    setAnnouncements([data, ...announcements])
    setBody("")
    setSaving(false)
  }

  async function handleDelete(announcementId: string) {
    await supabase.from('announcements').delete().eq('id', announcementId)
    setAnnouncements(announcements.filter((a) => a.id !== announcementId))
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-sm text-brown/40">
      Loading...
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/dashboard/${id}`)}
          className="text-xs text-brown/30 hover:text-brown/60 transition-colors mb-6 block"
        >
          ← Back
        </button>
        <p className="text-[10px] tracking-widest uppercase text-brown/30 mb-1">
          Editor
        </p>
        <h1 className="text-[32px] font-medium tracking-tight text-brown leading-none">
          Announcements
        </h1>
      </div>

      {/* Post form */}
      <form onSubmit={handlePost} className="flex flex-col gap-3 mb-8">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest text-brown/40">
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write an announcement for your attendees..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="w-full py-2.5 bg-brown text-paper text-sm font-medium rounded-lg hover:bg-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Posting..." : "Post announcement"}
        </button>
      </form>

      {/* Announcements list */}
      <div className="flex flex-col gap-3">
        {announcements.length === 0 && (
          <p className="text-sm text-brown/30 text-center py-10">
            No announcements yet.
          </p>
        )}
        {announcements.map((a) => (
          <div
            key={a.id}
            className="border border-brown/10 rounded-xl px-4 py-3"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[13px] text-brown leading-relaxed">{a.body}</p>
              <button
                onClick={() => handleDelete(a.id)}
                className="shrink-0 text-xs text-brown/25 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            </div>
            <p className="text-[10px] text-brown/30 mt-2">{formatDate(a.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}