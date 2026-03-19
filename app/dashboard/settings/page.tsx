"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-client";
import { useRouter } from "next/navigation";
import { useTheme, tokens, inputStyle } from "../theme-context";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [fullName, setFullName]       = useState("");
  const [org, setOrg]                 = useState("");
  const [email, setEmail]             = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw]     = useState("");
  const [loading, setLoading]         = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSaved, setProfileSaved]   = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [profileError, setProfileError]   = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router   = useRouter();
  const supabase = createClient();
  const { theme } = useTheme();
  const t = tokens(theme);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/dashboard/login"); return; }

      setEmail(user.email ?? "")

      const { data } = await supabase
        .from('profiles').select('full_name, organization').eq('id', user.id).single()

      if (data) {
        setFullName(data.full_name ?? "")
        setOrg(data.organization ?? "")
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileError("")
    setSavingProfile(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      organization: org || null,
    })

    if (error) { setProfileError(error.message); setSavingProfile(false); return; }
    setProfileSaved(true); setSavingProfile(false)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError("")

    if (newPassword !== confirmPw) { setPasswordError("Passwords don't match."); return; }
    if (newPassword.length < 8)    { setPasswordError("Password must be at least 8 characters."); return; }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) { setPasswordError(error.message); setSavingPassword(false); return; }
    setPasswordSaved(true); setSavingPassword(false)
    setNewPassword(""); setConfirmPw("")
    setTimeout(() => setPasswordSaved(false), 2000)
  }

  async function handleDeleteAccount() {
    // Sign out — full account deletion requires a server function
    // For now, sign out and show a message
    await supabase.auth.signOut()
    router.push("/dashboard/login")
  }

  const lbl = { color: t.textSub, fontSize: "13px", fontWeight: 500 } as React.CSSProperties
  const section = "text-[11px] uppercase tracking-widest font-medium"

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ color: t.textSub }}>Loading...</div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="px-12 py-12 max-w-2xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="text-[32px] font-semibold tracking-tight mb-1" style={{ color: t.text }}>Settings</h1>
        <p className="text-[15px]" style={{ color: t.textSub }}>Manage your account</p>
      </motion.div>

      <div className="flex flex-col gap-10">

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <p className={section} style={{ color: t.textFaint, marginBottom: "16px" }}>Profile</p>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label style={lbl}>Full name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith" style={inputStyle(t)} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label style={lbl}>Organization</label>
                <input type="text" value={org} onChange={e => setOrg(e.target.value)}
                  placeholder="e.g. KCF" style={inputStyle(t)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={lbl}>Email</label>
              <input
                type="email" value={email} disabled
                className="rounded-xl px-3 py-3 text-[15px] outline-none opacity-50 cursor-not-allowed"
                style={{ background: t.inputBg, border: `1px solid ${t.border}`, color: t.text }}
              />
              <p className="text-[12px]" style={{ color: t.textFaint }}>Email cannot be changed</p>
            </div>

            <AnimatePresence>
              {profileError && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="text-[13px]" style={{ color: "#ef4444" }}>
                  {profileError}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              <motion.button
                type="submit" disabled={savingProfile} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
                style={{ background: t.btnBg, color: t.btnText }}
              >
                <AnimatePresence mode="wait">
                  {profileSaved ? (
                    <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <Check size={14} /> Saved
                    </motion.span>
                  ) : (
                    <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {savingProfile ? "Saving..." : "Save profile"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Divider */}
        <div style={{ height: '1px', background: t.border }} />

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <p className={section} style={{ color: t.textFaint, marginBottom: "16px" }}>Change password</p>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label style={lbl}>New password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters" style={inputStyle(t)} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label style={lbl}>Confirm password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  placeholder="••••••••" style={inputStyle(t)} />
              </div>
            </div>

            <AnimatePresence>
              {passwordError && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="text-[13px]" style={{ color: "#ef4444" }}>
                  {passwordError}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              <motion.button
                type="submit" disabled={savingPassword || !newPassword || !confirmPw}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
                style={{ background: t.btnBg, color: t.btnText }}
              >
                <AnimatePresence mode="wait">
                  {passwordSaved ? (
                    <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <Check size={14} /> Updated
                    </motion.span>
                  ) : (
                    <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {savingPassword ? "Updating..." : "Update password"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Divider */}
        <div style={{ height: '1px', background: t.border }} />

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <p className={section} style={{ color: "#ef4444", marginBottom: "16px" }}>Danger zone</p>
          <div
            className="p-5 rounded-2xl flex items-center justify-between gap-4"
            style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}
          >
            <div>
              <p className="text-[15px] font-medium mb-0.5" style={{ color: t.text }}>Sign out of all devices</p>
              <p className="text-[13px]" style={{ color: t.textSub }}>
                This will sign you out everywhere
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!showDeleteConfirm ? (
                <motion.button
                  key="initial"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-medium transition-opacity hover:opacity-80"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                >
                  Sign out everywhere
                </motion.button>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 shrink-0"
                >
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-2 rounded-xl text-[13px] transition-opacity hover:opacity-70"
                    style={{ color: t.textSub }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 rounded-xl text-[13px] font-medium"
                    style={{ background: "#ef4444", color: "#fff" }}
                  >
                    Confirm
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}