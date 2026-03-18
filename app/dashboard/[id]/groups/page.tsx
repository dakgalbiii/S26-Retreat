"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";

type Member = {
  id: string;
  name: string;
  group_id: string;
}

type Group = {
  id: string;
  name: string;
  position: number;
  members: Member[];
}

export default function GroupsEditorPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // New group form
  const [groupName, setGroupName] = useState("");

  // New member form
  const [memberName, setMemberName] = useState("");

  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }

      const { data: groupRows, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('event_id', id)
        .order('position')

      if (groupError) { console.error(groupError); return; }

      const { data: memberRows, error: memberError } = await supabase
        .from('members')
        .select('*')

      if (memberError) { console.error(memberError); return; }

      const shaped: Group[] = (groupRows ?? []).map((g) => ({
        ...g,
        members: (memberRows ?? []).filter((m) => m.group_id === g.id),
      }))

      setGroups(shaped)
      setLoading(false)
    }
    load()
  }, [])

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!groupName.trim()) return
    setSaving(true)

    const { data, error } = await supabase
      .from('groups')
      .insert({ event_id: id, name: groupName, position: groups.length })
      .select()
      .single()

    if (error) { console.error(error); setSaving(false); return; }
    setGroups([...groups, { ...data, members: [] }])
    setGroupName("")
    setOpenGroup(data.id)
    setSaving(false)
  }

  async function handleDeleteGroup(groupId: string) {
    await supabase.from('groups').delete().eq('id', groupId)
    setGroups(groups.filter((g) => g.id !== groupId))
    if (openGroup === groupId) setOpenGroup(null)
  }

  async function handleAddMember(e: React.FormEvent, groupId: string) {
    e.preventDefault()
    if (!memberName.trim()) return
    setSaving(true)

    const { data, error } = await supabase
      .from('members')
      .insert({ group_id: groupId, name: memberName })
      .select()
      .single()

    if (error) { console.error(error); setSaving(false); return; }

    setGroups(groups.map((g) =>
      g.id === groupId
        ? { ...g, members: [...g.members, data] }
        : g
    ))
    setMemberName("")
    setSaving(false)
  }

  async function handleDeleteMember(groupId: string, memberId: string) {
    await supabase.from('members').delete().eq('id', memberId)
    setGroups(groups.map((g) =>
      g.id === groupId
        ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
        : g
    ))
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
          Groups
        </h1>
      </div>

      {/* Add group form */}
      <form onSubmit={handleAddGroup} className="flex gap-2 mb-8">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="New group name"
          className="flex-1 px-3 py-2.5 text-sm border border-brown/20 rounded-lg focus:outline-none focus:border-brown/50 bg-transparent text-brown placeholder:text-brown/25"
        />
        <button
          type="submit"
          disabled={saving || !groupName.trim()}
          className="px-4 py-2.5 bg-brown text-paper text-sm font-medium rounded-lg hover:bg-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add group
        </button>
      </form>

      {/* Groups list */}
      <div className="flex flex-col gap-3">
        {groups.length === 0 && (
          <p className="text-sm text-brown/30 text-center py-10">
            No groups yet. Add your first one above.
          </p>
        )}
        {groups.map((group) => {
          const isOpen = openGroup === group.id
          return (
            <div key={group.id} className="border border-brown/10 rounded-xl overflow-hidden">
              {/* Group header */}
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setOpenGroup(isOpen ? null : group.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span className="text-[13px] font-medium text-brown">{group.name}</span>
                  <span className="text-[10px] text-brown/30">{group.members.length} members</span>
                  <span className={`text-[10px] text-brown/25 transition-transform duration-200 inline-block ml-auto ${isOpen ? "rotate-180" : ""}`}>
                    ↓
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="ml-4 text-xs text-brown/25 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>

              {/* Expanded members */}
              {isOpen && (
                <div className="border-t border-brown/8 px-4 py-3">
                  {/* Members list */}
                  <div className="flex flex-col gap-2 mb-3">
                    {group.members.length === 0 && (
                      <p className="text-[11px] text-brown/25 py-2">No members yet.</p>
                    )}
                    {group.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <span className="text-[12px] text-brown/60">{member.name}</span>
                        <button
                          onClick={() => handleDeleteMember(group.id, member.id)}
                          className="text-[10px] text-brown/20 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add member form */}
                  <form
                    onSubmit={(e) => handleAddMember(e, group.id)}
                    className="flex gap-2 mt-2"
                  >
                    <input
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Member name"
                      className="flex-1 px-3 py-2 text-sm border border-brown/15 rounded-lg focus:outline-none focus:border-brown/40 bg-transparent text-brown placeholder:text-brown/20"
                    />
                    <button
                      type="submit"
                      disabled={saving || !memberName.trim()}
                      className="px-3 py-2 bg-brown/8 text-brown text-xs font-medium rounded-lg hover:bg-brown/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}