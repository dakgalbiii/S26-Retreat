"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-client";
import { useRouter, useParams } from "next/navigation";
import { useTheme, tokens, inputStyle } from "../../theme-context";
import { ChevronDown, Trash2, UserPlus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Member = { id: string; name: string; group_id: string; }
type Group  = { id: string; name: string; position: number; members: Member[]; }

export default function GroupsEditorPage() {
  const [groups, setGroups]         = useState<Group[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [openGroup, setOpenGroup]   = useState<string | null>(null);
  const [groupName, setGroupName]   = useState("");
  const [memberName, setMemberName] = useState("");
  const router   = useRouter();
  const { id }   = useParams();
  const supabase = createClient();
  const { theme } = useTheme();
  const t = tokens(theme);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }
      const [{ data: groupRows }, { data: memberRows }] = await Promise.all([
        supabase.from('groups').select('*').eq('event_id', id).order('position'),
        supabase.from('members').select('*'),
      ])
      setGroups((groupRows ?? []).map(g => ({ ...g, members: (memberRows ?? []).filter(m => m.group_id === g.id) })))
      setLoading(false)
    }
    load()
  }, [])

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!groupName.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('groups').insert({ event_id: id, name: groupName, position: groups.length }).select().single()
    if (error) { console.error(error); setSaving(false); return; }
    setGroups([...groups, { ...data, members: [] }])
    setGroupName(""); setOpenGroup(data.id); setSaving(false)
  }

  async function handleDeleteGroup(groupId: string) {
    await supabase.from('groups').delete().eq('id', groupId)
    setGroups(groups.filter(g => g.id !== groupId))
    if (openGroup === groupId) setOpenGroup(null)
  }

  async function handleAddMember(e: React.FormEvent, groupId: string) {
    e.preventDefault()
    if (!memberName.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('members').insert({ group_id: groupId, name: memberName }).select().single()
    if (error) { console.error(error); setSaving(false); return; }
    setGroups(groups.map(g => g.id === groupId ? { ...g, members: [...g.members, data] } : g))
    setMemberName(""); setSaving(false)
  }

  async function handleDeleteMember(groupId: string, memberId: string) {
    await supabase.from('members').delete().eq('id', memberId)
    setGroups(groups.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m.id !== memberId) } : g))
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ color: t.textSub }}>Loading...</div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="px-12 py-12 max-w-3xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="text-[32px] font-semibold tracking-tight mb-1" style={{ color: t.text }}>Groups</h1>
        <p className="text-[15px]" style={{ color: t.textSub }}>
          {groups.length} group{groups.length !== 1 ? 's' : ''} · {groups.reduce((a, g) => a + g.members.length, 0)} members total
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        onSubmit={handleAddGroup}
        className="flex gap-3 mb-8"
      >
        <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
          placeholder="New group name" style={{ ...inputStyle(t), flex: 1 }} />
        <motion.button
          type="submit" disabled={saving || !groupName.trim()} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-medium disabled:opacity-40 shrink-0"
          style={{ background: t.btnBg, color: t.btnText }}
        >
          <Plus size={15} /> Add group
        </motion.button>
      </motion.form>

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {groups.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[15px] text-center py-16" style={{ color: t.textFaint }}
            >
              No groups yet
            </motion.p>
          )}
          {groups.map((group, i) => {
            const isOpen = openGroup === group.id
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${t.border}` }}
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : group.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={15} style={{ color: t.textFaint }} />
                    </motion.div>
                    <span className="text-[15px] font-medium" style={{ color: t.text }}>{group.name}</span>
                    <span className="text-[13px]" style={{ color: t.textFaint }}>{group.members.length} members</span>
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-2 rounded-lg transition-colors shrink-0"
                    style={{ color: t.textFaint }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}
                  >
                    <Trash2 size={15} />
                  </motion.button>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 py-4" style={{ borderTop: `1px solid ${t.border}`, background: t.surface }}>
                        <div className="flex flex-col gap-2.5 mb-5">
                          {group.members.length === 0 && (
                            <p className="text-[13px] py-1" style={{ color: t.textFaint }}>No members yet</p>
                          )}
                          <AnimatePresence>
                            {group.members.map(member => (
                              <motion.div
                                key={member.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-between"
                              >
                                <span className="text-[14px]" style={{ color: t.textSub }}>{member.name}</span>
                                <button
                                  onClick={() => handleDeleteMember(group.id, member.id)}
                                  className="text-[13px] transition-colors px-2 py-1 rounded-lg"
                                  style={{ color: t.textFaint }}
                                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                                  onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}
                                >
                                  Remove
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                        <form onSubmit={e => handleAddMember(e, group.id)} className="flex gap-2">
                          <input type="text" value={memberName} onChange={e => setMemberName(e.target.value)}
                            placeholder="Member name" style={{ ...inputStyle(t), flex: 1 }} />
                          <motion.button
                            type="submit" disabled={saving || !memberName.trim()} whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium disabled:opacity-40 shrink-0"
                            style={{ background: t.btnBg, color: t.btnText }}
                          >
                            <UserPlus size={13} /> Add
                          </motion.button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}