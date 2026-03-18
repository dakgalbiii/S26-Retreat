"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";

type Link = {
  id: string;
  label: string;
  url: string;
  position: number;
}

export default function LinksEditorPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('event_id', id)
        .order('position')

      if (error) { console.error(error); return; }
      setLinks(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!label || !url) return
    setSaving(true)

    const { data, error } = await supabase
      .from('links')
      .insert({ event_id: id, label, url, position: links.length })
      .select()
      .single()

    if (error) { console.error(error); setSaving(false); return; }
    setLinks([...links, data])
    setLabel("")
    setUrl("")
    setSaving(false)
  }

  async function handleDelete(linkId: string) {
    await supabase.from('links').delete().eq('id', linkId)
    setLinks(links.filter((l) => l.id !== linkId))
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
          Links
        </h1>
      </div>

      {/* Add link form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-8">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest text-brown/40">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Spotify Playlist"
            className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest text-brown/40">
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !label || !url}
          className="w-full py-2.5 bg-brown text-paper text-sm font-medium rounded-lg hover:bg-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Adding..." : "Add link"}
        </button>
      </form>

      {/* Links list */}
      <div className="flex flex-col gap-2">
        {links.length === 0 && (
          <p className="text-sm text-brown/30 text-center py-10">
            No links yet. Add your first one above.
          </p>
        )}
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between border border-brown/10 rounded-xl px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-brown truncate">{link.label}</p>
              <p className="text-[11px] text-brown/35 truncate">{link.url}</p>
            </div>
            <button
              onClick={() => handleDelete(link.id)}
              className="shrink-0 ml-4 text-xs text-brown/25 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}