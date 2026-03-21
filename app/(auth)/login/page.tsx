"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6"
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
              Sign in
            </h1>
            <p className="text-[14px]" style={{ color: "rgba(0,0,0,0.4)" }}>
              Organizer portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {[
              { label: "Email",    type: "email",    value: email,    onChange: setEmail,    placeholder: "you@example.com" },
              { label: "Password", type: "password", value: password, onChange: setPassword, placeholder: "••••••••"        },
            ].map((field, i) => (
              <motion.div
                key={field.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.05, duration: 0.4 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-[12px] font-medium" style={{ color: "rgba(0,0,0,0.45)" }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  required
                  autoFocus={i === 0}
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
              transition={{ delay: 0.24, duration: 0.4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 text-[14px] font-medium rounded-xl disabled:opacity-50 mt-1 transition-opacity hover:opacity-80"
              style={{ background: "#171717", color: "#ffffff" }}
            >
              {loading ? "Signing in..." : "Continue"}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-center text-[13px] mt-5"
          style={{ color: "rgba(0,0,0,0.4)" }}
        >
          Don't have an account?{" "}
          <a href="/signup" className="underline font-medium"
            style={{ color: "#171717" }}>
            Sign up
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}