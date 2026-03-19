"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase-client";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider, useTheme, tokens } from "./theme-context";
import {
  LayoutGrid, Plus, Calendar, Users,
  Megaphone, Link, Palette, LogOut,
  PanelLeftClose, PanelLeftOpen, Sun, Moon, Circle, Settings,
} from "lucide-react";

type Event = { id: string; title: string; slug: string; }
type Profile = { full_name: string | null; organization: string | null; }

const NAV_SECTIONS = [
  { key: "schedule",      label: "Schedule",      icon: Calendar },
  { key: "groups",        label: "Groups",        icon: Users },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "links",         label: "Links",         icon: Link },
  { key: "design",        label: "Design",        icon: Palette },
]

function Sidebar() {
  const [events, setEvents]     = useState<Event[]>([]);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, toggle } = useTheme();
  const t = tokens(theme);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: eventsData }, { data: profileData }] = await Promise.all([
        supabase.from('events').select('id, title, slug').order('created_at', { ascending: false }),
        supabase.from('profiles').select('full_name, organization').eq('id', user.id).single(),
      ])

      setEvents(eventsData ?? [])
      setProfile(profileData)
    }
    load()
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut();
    setEvents([]);
    setProfile(null);
    router.push("/dashboard/login");
  }

  function navBtn(active: boolean) {
    return {
      background: active ? t.surfaceHover : "transparent",
      color: active ? t.text : t.textSub,
    };
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <aside
      className="h-screen sticky top-0 flex flex-col shrink-0 transition-all duration-200"
      style={{
        width: collapsed ? "60px" : "260px",
        background: t.sidebarBg,
        borderRight: `1px solid ${t.border}`,
      }}
    >
      {/* Top */}
      <div
        className="flex items-center justify-between px-4 py-5"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        {!collapsed && (
          <span className="text-[17px] font-semibold tracking-tight" style={{ color: t.text }}>
            Prelude
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="transition-opacity ml-auto p-1.5 rounded-lg hover:opacity-60"
          style={{ color: t.textFaint }}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
          style={navBtn(pathname === '/dashboard')}
        >
          <LayoutGrid size={16} className="shrink-0" />
          {!collapsed && <span className="text-[14px]">All Events</span>}
        </button>

        <button
          onClick={() => router.push('/dashboard/new')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-4"
          style={navBtn(pathname === '/dashboard/new')}
        >
          <Plus size={16} className="shrink-0" />
          {!collapsed && <span className="text-[14px]">New Event</span>}
        </button>

        {!collapsed && events.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest px-3 mb-2" style={{ color: t.textFaint }}>
              Events
            </p>
            {events.map((event) => {
              const isEventActive = pathname.includes(event.id);
              return (
                <div key={event.id} className="mb-0.5">
                  <button
                    onClick={() => router.push(`/dashboard/${event.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                    style={navBtn(isEventActive)}
                  >
                    <Circle
                      size={7} className="shrink-0"
                      style={{
                        fill: isEventActive ? t.text : t.textFaint,
                        color: isEventActive ? t.text : t.textFaint,
                      }}
                    />
                    <span className="text-[14px] truncate">{event.title}</span>
                  </button>

                  {isEventActive && (
                    <div className="ml-5 mt-0.5 mb-2 flex flex-col gap-0.5">
                      {NAV_SECTIONS.map((section) => {
                        const Icon = section.icon;
                        const active = pathname.includes(`/${section.key}`);
                        return (
                          <button
                            key={section.key}
                            onClick={() => router.push(`/dashboard/${event.id}/${section.key}`)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                            style={navBtn(active)}
                          >
                            <Icon size={14} className="shrink-0" />
                            <span className="text-[13px]">{section.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {collapsed && events.map((event) => {
          const isEventActive = pathname.includes(event.id);
          return (
            <button
              key={event.id}
              onClick={() => router.push(`/dashboard/${event.id}`)}
              className="w-full flex items-center justify-center py-2.5 rounded-lg transition-colors"
              title={event.title}
            >
              <Circle
                size={7}
                style={{
                  fill: isEventActive ? t.text : t.textFaint,
                  color: isEventActive ? t.text : t.textFaint,
                }}
              />
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 flex flex-col gap-0.5" style={{ borderTop: `1px solid ${t.border}` }}>

        {/* Profile chip */}
        {!collapsed && profile && (
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-1 hover:opacity-80"
            style={navBtn(pathname === '/dashboard/settings')}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold"
              style={{ background: t.border, color: t.text }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium truncate" style={{ color: t.text }}>
                {profile.full_name ?? "No name"}
              </p>
              {profile.organization && (
                <p className="text-[11px] truncate" style={{ color: t.textFaint }}>
                  {profile.organization}
                </p>
              )}
            </div>
          </button>
        )}

        {collapsed && (
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="w-full flex items-center justify-center py-2.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: t.textSub }}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        )}

        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:opacity-70"
          style={{ color: t.textSub }}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span className="text-[14px]">{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:opacity-70"
          style={{ color: t.textSub }}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="text-[14px]">Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const t = tokens(theme);
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: t.bg }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ background: t.bg }}>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardShell>{children}</DashboardShell>
    </ThemeProvider>
  );
}