"use client";

import { useState, useMemo } from "react";
import type { SmallGroup } from "@/lib/groups";

export default function GroupsClient({ groups }: { groups: SmallGroup[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return groups;

    return groups
      .map((group) => {
        const leaderMatch = group.leader.toLowerCase().includes(q);
        const groupNameMatch = group.name.toLowerCase().includes(q);
        const matchedMembers = group.members.filter((m) =>
          m.toLowerCase().includes(q)
        );

        if (leaderMatch || groupNameMatch || matchedMembers.length > 0) {
          return { ...group, matchedMembers, highlight: q };
        }
        return null;
      })
      .filter(Boolean) as (SmallGroup & {
      matchedMembers?: string[];
      highlight?: string;
    })[];
  }, [query, groups]);

  const hasQuery = query.trim().length > 0;

  return (
    <div>
      {/* Search */}
      <div className="mb-12">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your name or leader..."
            className="w-full bg-transparent border-b border-forest/20 py-3 pr-8 text-sm text-forest placeholder:text-forest/30 outline-none focus:border-forest/50 transition-colors"
          />
          {hasQuery && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-forest/30 hover:text-forest/60 transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {hasQuery && (
          <p className="mt-3 text-[10px] text-forest/35 tracking-wide">
            {filtered.length === 0
              ? "No results found"
              : `${filtered.length} group${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        )}
      </div>

      {/* Groups list */}
      <div className="space-y-0">
        {filtered.map((group, i) => (
          <GroupCard
            key={group.name}
            group={group}
            index={i}
            highlight={hasQuery ? query : ""}
          />
        ))}

        {filtered.length === 0 && hasQuery && (
          <div className="py-16 text-center">
            <p className="text-xs text-forest/30 tracking-wide">
              No one found matching "{query}"
            </p>
            <p className="text-[10px] text-forest/20 mt-2">
              Try a different spelling or ask your leader
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function highlight(text: string, query: string) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-gold/20 text-forest rounded-sm px-px">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

function GroupCard({
  group,
  index,
  highlight: q,
}: {
  group: SmallGroup;
  index: number;
  highlight: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-forest/10 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-6 py-5 text-left group"
      >
        {/* Number */}
        <span className="text-[10px] text-forest/25 tabular-nums w-5 shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Group name */}
        <span className="flex-1 text-sm font-medium text-forest">
          {highlight(group.name, q)}
        </span>

        {/* Leader */}
        <span className="text-[10px] text-forest/40 tracking-wide hidden sm:block">
          {highlight(group.leader, q)}
        </span>

        {/* Member count */}
        <span className="text-[10px] text-forest/30">
          {group.members.length} members
        </span>

        {/* Chevron */}
        <span
          className={`text-forest/30 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          ↓
        </span>
      </button>

      {open && (
        <div className="pb-6 pl-11 pr-4">
          {/* Leader row */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-[9px] tracking-widest uppercase text-forest/30 font-medium">
              Leader
            </span>
            <span className="text-xs text-forest/60 ml-2">
              {highlight(group.leader, q)}
            </span>
          </div>

          {/* Members grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            {group.members.map((member) => (
              <span key={member} className="text-xs text-forest/70 font-light">
                {highlight(member, q)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}