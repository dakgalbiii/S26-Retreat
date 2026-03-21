"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [org, setOrg]           = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const router   = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace('/dashboard');
    }
    checkSession();
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id, full_name: fullName, organization: org || null,
      });
    }
    router.push("/dashboard");
  }

  const fields = [
    { label: "Full name",         type: "text",     value: fullName,  onChange: setFullName,  placeholder: "Jane Smith",                   required: true  },
    { label: "Organization",      type: "text",     value: org,       onChange: setOrg,       placeholder: "e.g. KCF, SBU Hackathon Club", required: false },
    { label: "Email",             type: "email",    value: email,     onChange: setEmail,     placeholder: "you@example.com",              required: true  },
    { label: "Password",          type: "password", value: password,  onChange: setPassword,  placeholder: "Min. 8 characters",            required: true  },
    { label: "Confirm password",  type: "password", value: confirm,   onChange: setConfirm,   placeholder: "••••••••",                     required: true  },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "#f5f5f3" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="text-[14px] font-semibold tracking-tight mb-6 text-center"
          style={{ color: "#171717" }}
        >
          Prelude
        </motion.p>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl px-8 py-8"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
          }}
        >
          {/* Header */}
          <div className="mb-7">
            <h1 className="text-[26px] font-semibold tracking-tight leading-none mb-1.5"
              style={{ color: "#171717" }}>
              Create account
            </h1>
            <p className="text-[14px]" style={{ color: "rgba(0,0,0,0.4)" }}>
              Start building your first event
            </p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {fields.map((field, i) => (
              <motion.div
                key={field.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.04, duration: 0.4 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-[12px] font-medium" style={{ color: "rgba(0,0,0,0.45)" }}>
                  {field.label}
                  {!field.required && (
                    <span className="ml-1 font-normal" style={{ color: "rgba(0,0,0,0.3)" }}>
                      (optional)
                    </span>
                  )}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full px-3 py-2.5 text-[14px] rounded-xl outline-none transition-colors"
                  style={{
                    background: "#f7f7f5",
                    border: "1px solid rgba(0,0,0,0.07)",
                    color: "#171717",
                  }}
                  onFocus={e => e.target.style.border = "1px solid rgba(0,0,0,0.2)"}
                  onBlur={e => e.target.style.border = "1px solid rgba(0,0,0,0.07)"}
                />
              </motion.div>
            ))}

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[13px]"
                  style={{ color: "#ef4444" }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 text-[14px] font-medium rounded-xl disabled:opacity-50 mt-1 transition-opacity hover:opacity-80"
              style={{ background: "#171717", color: "#ffffff" }}
            >
              {loading ? "Creating account..." : "Create account"}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-center text-[13px] mt-5"
          style={{ color: "rgba(0,0,0,0.4)" }}
        >
          Already have an account?{" "}
          <a href="/login" className="underline font-medium"
            style={{ color: "#171717" }}>
            Sign in
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}