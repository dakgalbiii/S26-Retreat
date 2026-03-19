"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
  const [fullName, setFullName]   = useState("");
  const [org, setOrg]             = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const router   = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    // Save profile
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        organization: org || null,
      })
    }

    router.push("/dashboard");
  }

  const fields = [
    { label: "Full name *",       type: "text",     value: fullName,  onChange: setFullName,  placeholder: "Jane Smith" },
    { label: "Organization",      type: "text",     value: org,       onChange: setOrg,       placeholder: "e.g. KCF, SBU Hackathon Club" },
    { label: "Email *",           type: "email",    value: email,     onChange: setEmail,     placeholder: "you@example.com" },
    { label: "Password *",        type: "password", value: password,  onChange: setPassword,  placeholder: "Min. 8 characters" },
    { label: "Confirm password *",type: "password", value: confirm,   onChange: setConfirm,   placeholder: "••••••••" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#fafafa" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-10"
        >
          <p className="text-[14px] font-semibold tracking-tight mb-8" style={{ color: "#171717" }}>
            Prelude
          </p>
          <h1 className="text-[34px] font-semibold tracking-tight leading-none mb-1" style={{ color: "#171717" }}>
            Create account
          </h1>
          <p className="text-[15px]" style={{ color: "rgba(0,0,0,0.4)" }}>
            Start building your first event
          </p>
        </motion.div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          {fields.map((field, i) => (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
              className="flex flex-col gap-1.5"
            >
              <label className="text-[13px] font-medium" style={{ color: "rgba(0,0,0,0.5)" }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                required={field.label.includes('*')}
                className="w-full px-3 py-3 text-[15px] rounded-xl outline-none"
                style={{ background: "#f2f2f0", border: "1px solid rgba(0,0,0,0.06)", color: "#171717" }}
              />
            </motion.div>
          ))}

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[13px]" style={{ color: "#ef4444" }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit" disabled={loading}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 text-[15px] font-medium rounded-xl disabled:opacity-50 mt-1 transition-opacity hover:opacity-80"
            style={{ background: "#171717", color: "#ffffff" }}
          >
            {loading ? "Creating account..." : "Create account"}
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-center text-[13px]"
            style={{ color: "rgba(0,0,0,0.4)" }}
          >
            Already have an account?{" "}
            <a href="/dashboard/login" className="underline" style={{ color: "#171717" }}>Sign in</a>
          </motion.p>
        </form>
      </motion.div>
    </div>
  );
}