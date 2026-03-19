"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import {
  Calendar, Users, Megaphone, Link,
  Palette, ArrowRight, Check, Zap
} from "lucide-react";

// ── Scroll-triggered fade-up ─────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(250,250,250,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
      }}
    >
      <span className="text-[17px] font-semibold tracking-tight" style={{ color: "#171717" }}>
        Prelude
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/login")}
          className="px-4 py-2 text-[14px] rounded-xl transition-opacity hover:opacity-60"
          style={{ color: "rgba(0,0,0,0.5)" }}
        >
          Sign in
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/dashboard/signup")}
          className="px-4 py-2 text-[14px] font-medium rounded-xl transition-opacity hover:opacity-80"
          style={{ background: "#171717", color: "#fff" }}
        >
          Get started
        </motion.button>
      </div>
    </motion.nav>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();

  const features = [
    { icon: Calendar, label: "Schedule", desc: "Build day-by-day timelines with live countdowns so attendees always know what's next." },
    { icon: Users, label: "Groups", desc: "Assign people to teams, cabins, or small groups. Searchable by name in seconds." },
    { icon: Megaphone, label: "Announcements", desc: "Push real-time updates to all attendees without group chats or email blasts." },
    { icon: Link, label: "Links", desc: "One place for Spotify playlists, forms, maps, and anything else your event needs." },
    { icon: Palette, label: "Design", desc: "Brand each event with your own colors, fonts, and tab names. No code required." },
    { icon: Zap, label: "Instant access", desc: "Attendees join with a simple access code — no downloads, no accounts, no friction." },
  ]

  const useCases = [
    { label: "Campus retreats", desc: "Spiritual retreats, mission trips, and overnight programs." },
    { label: "Hackathons", desc: "Multi-day builds with team assignments and tight schedules." },
    { label: "Pop-up markets", desc: "Vendor lineups, set times, and links all in one place." },
    { label: "Conferences", desc: "Multi-track sessions, speaker bios, and live updates." },
    { label: "Youth camps", desc: "Cabin groups, daily schedules, and parent-friendly links." },
    { label: "Club events", desc: "Any campus org event that needs more than a Google Doc." },
  ]

  const steps = [
    { n: "01", label: "Create your event", desc: "Name it, set an access code, and pick your colors. Takes under two minutes." },
    { n: "02", label: "Build your content", desc: "Add your schedule, assign groups, drop in links. Everything in one dashboard." },
    { n: "03", label: "Share the link", desc: "Attendees open it on their phone and enter the code. That's it — they're in." },
  ]

  const pricing = [
    {
      label: "Free",
      price: "$0",
      sub: "forever",
      features: ["Unlimited events", "Schedule builder", "Group assignments", "Announcements", "Links", "Custom colors"],
      cta: "Get started free",
      primary: false,
    },
    {
      label: "Pro",
      price: "$12",
      sub: "per month",
      features: ["Everything in Free", "CSV group import", "Custom domain", "Priority support", "Analytics", "Remove Prelude branding"],
      cta: "Coming soon",
      primary: true,
    },
  ]

  return (
    <div style={{ background: "#fafafa", color: "#171717", fontFamily: "'Neue Haas Grotesk Display Pro', sans-serif" }}>
      <Nav />

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-[12px] font-medium"
          style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Now in beta — free for all organizers
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(42px,7vw,84px)] font-semibold tracking-tight leading-[1.05] mb-6 max-w-4xl"
          style={{ color: "#171717", letterSpacing: "-0.03em" }}
        >
          The event app your
          <br />
          <span style={{ color: "rgba(0,0,0,0.3)" }}>attendees will actually use.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="text-[18px] max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: "rgba(0,0,0,0.45)" }}
        >
          Build a shareable event companion in minutes — schedules, groups, announcements, and links, all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="flex items-center gap-3 flex-wrap justify-center"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/dashboard/signup")}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-medium transition-opacity hover:opacity-80"
            style={{ background: "#171717", color: "#fff" }}
          >
            Create your first event
            <ArrowRight size={15} />
          </motion.button>
          <button
            onClick={() => router.push("/dashboard/login")}
            className="px-6 py-3.5 rounded-xl text-[15px] transition-opacity hover:opacity-60"
            style={{ color: "rgba(0,0,0,0.45)", border: "1px solid rgba(0,0,0,0.1)" }}
          >
            Sign in
          </button>
        </motion.div>

        {/* Mock UI preview */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 w-full max-w-2xl mx-auto rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#fff", boxShadow: "0 24px 80px rgba(0,0,0,0.08)" }}
        >
          {/* Browser chrome */}
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#f7f7f5" }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(0,0,0,0.12)" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(0,0,0,0.12)" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(0,0,0,0.12)" }} />
            <div className="flex-1 mx-4 px-3 py-1 rounded-md text-[11px] text-center" style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.3)" }}>
              prelude.app/e/summit-2026
            </div>
          </div>

          {/* Event UI — black and white */}
          <div className="p-6" style={{ background: "#fafafa" }}>

            {/* Header */}
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(0,0,0,0.3)" }}>
                Summit 2026 · Day 2
              </p>
              <h3 className="text-[20px] font-semibold tracking-tight" style={{ color: "#171717" }}>
                Schedule
              </h3>
            </div>

            {/* Countdown banner */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
              style={{ background: "#171717" }}
            >
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Happening now
                </p>
                <p className="text-[13px] font-medium" style={{ color: "#fff" }}>
                  Workshop: Product Design
                </p>
              </div>
              <div className="text-right">
                <p className="text-[16px] font-semibold tabular-nums" style={{ color: "#fff" }}>42m</p>
                <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>remaining</p>
              </div>
            </div>

            {/* Schedule blocks */}
            {[
              { time: "9:00-10:00am", title: "Opening Keynote", now: false, past: true },
              { time: "10:00-11:30am", title: "Workshop: Product Design", now: true, past: false },
              { time: "12:00-1:00pm", title: "Lunch Break", now: false, past: false },
              { time: "1:00-2:30pm", title: "Panel: Future of Work", now: false, past: false },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2"
                style={{
                  background: item.now ? "#171717" : item.past ? "transparent" : "#fff",
                  border: item.now ? "none" : `1px solid rgba(0,0,0,${item.past ? "0.04" : "0.08"})`,
                  opacity: item.past ? 0.4 : 1,
                }}
              >
                <span
                  className="text-[10px] font-mono w-24 shrink-0"
                  style={{ color: item.now ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)" }}
                >
                  {item.time}
                </span>
                <span
                  className="text-[13px] font-medium flex-1"
                  style={{ color: item.now ? "#fff" : "#171717" }}
                >
                  {item.title}
                </span>
                {item.now && (
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
                  >
                    NOW
                  </span>
                )}
              </div>
            ))}

            {/* Bottom nav with lucide icons */}
            <div
              className="flex justify-around mt-5 pt-4"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
            >
              {[
                { icon: Calendar, label: "Schedule", active: true },
                { icon: Users, label: "Groups", active: false },
                { icon: Megaphone, label: "Updates", active: false },
                { icon: Link, label: "Links", active: false },
              ].map(({ icon: Icon, label, active }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <Icon
                    size={16}
                    style={{ color: active ? "#171717" : "rgba(0,0,0,0.25)" }}
                  />
                  <span
                    className="text-[9px] uppercase tracking-widest"
                    style={{ color: active ? "#171717" : "rgba(0,0,0,0.25)", fontWeight: active ? 600 : 400 }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-28 max-w-5xl mx-auto">
        <FadeUp className="mb-16 text-center">
          <p className="text-[12px] uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>How it works</p>
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Up and running in minutes
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <FadeUp key={step.n} delay={i * 0.08}>
              <div className="flex flex-col gap-4">
                <span className="text-[13px] font-mono" style={{ color: "rgba(0,0,0,0.2)" }}>{step.n}</span>
                <div className="h-px w-12" style={{ background: "rgba(0,0,0,0.12)" }} />
                <h3 className="text-[18px] font-semibold tracking-tight">{step.label}</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>{step.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-28" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="mb-16 text-center">
            <p className="text-[12px] uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>Features</p>
            <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Everything your event needs
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <FadeUp key={f.label} delay={i * 0.06}>
                  <div
                    className="p-6 rounded-2xl flex flex-col gap-4 h-full"
                    style={{ border: "1px solid rgba(0,0,0,0.06)", background: "#fafafa" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.05)" }}
                    >
                      <Icon size={18} style={{ color: "rgba(0,0,0,0.4)" }} />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold mb-1">{f.label}</p>
                      <p className="text-[14px] leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>{f.desc}</p>
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="px-6 py-28 max-w-5xl mx-auto">
        <FadeUp className="mb-16 text-center">
          <p className="text-[12px] uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>Who it's for</p>
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Built for community events
          </h2>
          <p className="text-[16px] mt-4 max-w-xl mx-auto" style={{ color: "rgba(0,0,0,0.45)" }}>
            Any event where people need to know where to be, who they're with, and what's happening next.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {useCases.map((uc, i) => (
            <FadeUp key={uc.label} delay={i * 0.05}>
              <div
                className="px-5 py-4 rounded-2xl flex flex-col gap-1"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <p className="text-[15px] font-semibold">{uc.label}</p>
                <p className="text-[13px]" style={{ color: "rgba(0,0,0,0.4)" }}>{uc.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-6 py-28" style={{ background: "#fff" }}>
        <div className="max-w-3xl mx-auto">
          <FadeUp className="mb-16 text-center">
            <p className="text-[12px] uppercase tracking-widest mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>Pricing</p>
            <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Simple, honest pricing
            </h2>
            <p className="text-[16px] mt-4" style={{ color: "rgba(0,0,0,0.45)" }}>
              Free while we're in beta. Pro features coming soon.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pricing.map((plan, i) => (
              <FadeUp key={plan.label} delay={i * 0.08}>
                <div
                  className="p-8 rounded-2xl flex flex-col gap-6 h-full"
                  style={{
                    border: plan.primary ? "1.5px solid #171717" : "1px solid rgba(0,0,0,0.08)",
                    background: plan.primary ? "#171717" : "#fafafa",
                  }}
                >
                  <div>
                    <p
                      className="text-[13px] font-medium uppercase tracking-widest mb-4"
                      style={{ color: plan.primary ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }}
                    >
                      {plan.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-[42px] font-semibold tracking-tight"
                        style={{ color: plan.primary ? "#fff" : "#171717", letterSpacing: "-0.03em" }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-[14px]" style={{ color: plan.primary ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
                        /{plan.sub}
                      </span>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-2.5 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-[14px]"
                        style={{ color: plan.primary ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}
                      >
                        <Check size={14} style={{ color: plan.primary ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)", flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => !plan.primary && router.push("/dashboard/signup")}
                    disabled={plan.primary}
                    className="w-full py-3 rounded-xl text-[14px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: plan.primary ? "rgba(255,255,255,0.1)" : "#171717",
                      color: plan.primary ? "rgba(255,255,255,0.5)" : "#fff",
                    }}
                  >
                    {plan.cta}
                  </motion.button>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-32 text-center max-w-3xl mx-auto">
        <FadeUp>
          <h2
            className="text-[clamp(32px,5vw,56px)] font-semibold tracking-tight mb-6"
            style={{ letterSpacing: "-0.03em" }}
          >
            Your next event deserves
            <br />
            better than a Google Doc.
          </h2>
          <p className="text-[17px] mb-10" style={{ color: "rgba(0,0,0,0.45)" }}>
            Build your event companion in minutes. Free, forever.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/dashboard/signup")}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-[16px] font-medium transition-opacity hover:opacity-80"
            style={{ background: "#171717", color: "#fff" }}
          >
            Get started free
            <ArrowRight size={16} />
          </motion.button>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-8 py-8 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        <span className="text-[14px] font-semibold" style={{ color: "#171717" }}>Prelude</span>
        <div className="flex items-center gap-6">
          <a href="/dashboard/login" className="text-[13px] transition-opacity hover:opacity-60" style={{ color: "rgba(0,0,0,0.4)" }}>
            Sign in
          </a>
          <a href="/dashboard/signup" className="text-[13px] transition-opacity hover:opacity-60" style={{ color: "rgba(0,0,0,0.4)" }}>
            Sign up
          </a>
        </div>
        <p className="text-[13px]" style={{ color: "rgba(0,0,0,0.3)" }}>
          © {new Date().getFullYear()} Prelude
        </p>
      </footer>
    </div>
  );
}