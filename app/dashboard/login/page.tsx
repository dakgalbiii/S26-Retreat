"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  }

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
            Sign in
          </h1>
          <p className="text-[15px]" style={{ color: "rgba(0,0,0,0.4)" }}>
            Organizer portal
          </p>
        </motion.div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {[
            { label: "Email", type: "email", value: email, onChange: setEmail, placeholder: "you@example.com" },
            { label: "Password", type: "password", value: password, onChange: setPassword, placeholder: "••••••••" },
          ].map((field, i) => (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
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
                required
                className="w-full px-3 py-3 text-[15px] rounded-xl outline-none transition-colors"
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
            transition={{ delay: 0.3, duration: 0.4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 text-[15px] font-medium rounded-xl transition-opacity disabled:opacity-50 mt-1"
            style={{ background: "#171717", color: "#ffffff" }}
          >
            {loading ? "Signing in..." : "Continue"}
          </motion.button>
        </form>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-center text-[13px] mt-2"
          style={{ color: "rgba(0,0,0,0.4)" }}
        >
          Don't have an account?{" "}
          <a href="/dashboard/signup" className="underline" style={{ color: "#171717" }}>
            Sign up
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}