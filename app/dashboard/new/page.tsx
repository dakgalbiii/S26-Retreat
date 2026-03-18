"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase-client";
import { useRouter } from "next/navigation";

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50)
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function NewEventPage() {
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [slug, setSlug] = useState("");
  const [accessCode, setAccessCode] = useState(() => generateCode());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  function handleTitleChange(val: string) {
    setTitle(val);
    setSlug(generateSlug(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/dashboard/login"); return; }

    const { data, error } = await supabase
      .from('events')
      .insert({
        organizer_id: user.id,
        title,
        tagline,
        slug,
        access_code: accessCode,
      })
      .select()
      .single()

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/dashboard/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-brown/30 hover:text-brown/60 transition-colors mb-6 block"
        >
          ← Back
        </button>
        <p className="text-[10px] tracking-widest uppercase text-brown/30 mb-1">
          New Event
        </p>
        <h1 className="text-[32px] font-medium tracking-tight text-brown leading-none">
          Create event
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest text-brown/40">
            Event name *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Spring Retreat 2027"
            required
            className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25"
          />
        </div>

        {/* Tagline */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest text-brown/40">
            Tagline
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. A weekend to remember"
            className="w-full px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25"
          />
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest text-brown/40">
            URL slug *
          </label>
          <div className="flex items-center border border-brown/20 rounded-lg focus-within:border-brown/50 overflow-hidden">
            <span className="px-3 py-2.5 text-sm text-brown/30 bg-brown/5 border-r border-brown/10">
              yourapp.com/e/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="spring-retreat-2027"
              required
              className="flex-1 px-3 py-2.5 text-sm bg-transparent text-brown outline-none placeholder:text-brown/25"
            />
          </div>
        </div>

        {/* Access code */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest text-brown/40">
            Access code *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              required
              className="flex-1 px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25 font-mono"
            />
            <button
              type="button"
              onClick={() => setAccessCode(generateCode())}
              className="px-3 py-2.5 text-xs border border-brown/20 rounded-lg text-brown/40 hover:border-brown/40 hover:text-brown/60 transition-colors"
            >
              Regenerate
            </button>
          </div>
          <p className="text-[10px] text-brown/30">
            Attendees enter this code to access the event
          </p>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brown text-paper text-sm font-medium rounded-lg hover:bg-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Creating..." : "Create event →"}
        </button>
      </form>
    </div>
  )
}