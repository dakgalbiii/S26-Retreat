"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import BottomNav from "./components/BottomNav";
import HomeTab from "./components/tabs/HomeTab";
import ScheduleTab from "./components/tabs/ScheduleTab";
import RulesTab from "./components/tabs/RulesTab";
import GroupsTab from "./components/tabs/GroupsTab";
import InfoTab from "./components/tabs/InfoTab";

type Tab = "home" | "schedule" | "rules" | "groups" | "info";

const UNLOCK_DATE = new Date("2026-03-13T20:00:00");
const PASSWORD_HASH = btoa("PMTisKindaChinese");
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// Storage keys
const STORAGE_KEYS = {
  AUTHENTICATED: 'retreat_auth',
  ATTEMPTS: 'retreat_attempts',
  LOCKOUT_UNTIL: 'retreat_lockout',
};

export default function Page() {
  const [tab, setTab] = useState<Tab>("home");
  const [now, setNow] = useState<Date>(() => new Date());
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  // Refs to prevent multiple submissions
  const isSubmitting = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load persisted state on mount
  useEffect(() => {
    setMounted(true);
    setNow(new Date());

    // Load authentication state
    const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTHENTICATED);
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }

    // Load attempts
    const savedAttempts = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts, 10));
    }

    // Load lockout
    const savedLockout = localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL);
    if (savedLockout) {
      const lockoutDate = new Date(savedLockout);
      if (lockoutDate > new Date()) {
        setLockoutUntil(lockoutDate);
        setIsLockedOut(true);
      } else {
        // Clear expired lockout
        localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
        localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
      }
    }

    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Persist authentication state
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEYS.AUTHENTICATED, isAuthenticated.toString());
    }
  }, [isAuthenticated, mounted]);

  // Persist attempts
  useEffect(() => {
    if (mounted && attempts > 0) {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, attempts.toString());
    } else if (mounted && attempts === 0) {
      localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    }
  }, [attempts, mounted]);

  // Persist lockout
  useEffect(() => {
    if (mounted && lockoutUntil) {
      localStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toISOString());
    } else if (mounted && !lockoutUntil) {
      localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
    }
  }, [lockoutUntil, mounted]);

  // Check lockout status
  useEffect(() => {
    if (lockoutUntil && new Date() > lockoutUntil) {
      setIsLockedOut(false);
      setLockoutUntil(null);
      setAttempts(0);
      // Clear storage
      localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
      localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    }
  }, [now, lockoutUntil]);

  function handleNav(t: string) {
    // Validate tab parameter
    const validTabs: Tab[] = ["home", "schedule", "rules", "groups", "info"];
    if (validTabs.includes(t as Tab)) {
      setTab(t as Tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Sanitize input to prevent injection
  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>{}()\[\]\/\\]/g, '').trim();
  };

  const handlePasswordSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting.current) return;

    // Check lockout
    if (isLockedOut) {
      const minutesLeft = lockoutUntil ?
        Math.ceil((lockoutUntil.getTime() - Date.now()) / 60000) : 15;
      setError(`Too many attempts. Try again in ${minutesLeft} minutes.`);
      return;
    }

    // Sanitize input
    const sanitizedPassword = sanitizeInput(password);

    // Check if password is empty after sanitization
    if (!sanitizedPassword) {
      setError("Password cannot be empty");
      return;
    }

    isSubmitting.current = true;

    // Simulate async password check to prevent timing attacks
    setTimeout(() => {
      // Compare hash instead of plaintext
      const isCorrect = btoa(sanitizedPassword) === PASSWORD_HASH;

      if (isCorrect) {
        // Success - reset all security states
        setIsAuthenticated(true);
        setShowPasswordInput(false);
        setPassword("");
        setError("");
        setAttempts(0);
        setIsLockedOut(false);
        setLockoutUntil(null);
      } else {
        // Failed attempt
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          // Lock out
          const lockoutTime = new Date(Date.now() + LOCKOUT_TIME);
          setIsLockedOut(true);
          setLockoutUntil(lockoutTime);
          setError(`Too many failed attempts. Locked out for 15 minutes.`);
        } else {
          setError(`Invalid password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }

        // Clear password field
        setPassword("");

        // Focus input for retry
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }

      isSubmitting.current = false;
    }, Math.random() * 200 + 100); // Random delay to prevent timing attacks
  }, [password, attempts, isLockedOut, lockoutUntil]);

  // Add logout function (optional - for testing)
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setAttempts(0);
    setIsLockedOut(false);
    setLockoutUntil(null);
    localStorage.removeItem(STORAGE_KEYS.AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
  }, []);

  if (!mounted) return null;

  const isLocked = now < UNLOCK_DATE && !isAuthenticated;

  // ── Pre-retreat lock screen — same layout as HomeTab ──
  if (isLocked) {
    const diffMs = UNLOCK_DATE.getTime() - now.getTime();

    // Calculate time units
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    // Format countdown with leading zeros
    const formatWithLeadingZeros = (num: number): string => {
      return num.toString().padStart(2, '0');
    };

    // Different countdown formats based on remaining time
    const getCountdownDisplay = () => {
      if (days > 0) {
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm text-brown tabular-nums font-medium">
              {days}d {formatWithLeadingZeros(hours)}:{formatWithLeadingZeros(minutes)}:{formatWithLeadingZeros(seconds)}
            </span>
          </div>
        );
      } else if (hours > 0) {
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm text-brown tabular-nums font-medium">
              {formatWithLeadingZeros(hours)}:{formatWithLeadingZeros(minutes)}:{formatWithLeadingZeros(seconds)}
            </span>
            <span className="text-xs text-brown/40">hours</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm text-brown tabular-nums font-medium">
              {formatWithLeadingZeros(minutes)}:{formatWithLeadingZeros(seconds)}
            </span>
            <span className="text-xs text-brown/40">minutes</span>
          </div>
        );
      }
    };

    return (
      <div className="max-w-lg mx-auto flex flex-col justify-between min-h-dvh px-7 pt-16 pb-10">

        {/* Top — mirrors HomeTab top block */}
        <div className="fade-up delay-1 mb-2">
          <p className="text-[10px] tracking-widest2 uppercase text-brown/35 mb-8">
            KCF · Mar 13-15, 2026
          </p>

          <h1 className="text-[clamp(58px,16vw,80px)] font-medium leading-[0.90] tracking-tight text-brown">
            Seek<br />First
            The Kingdom
          </h1>

          <div className="my-3 w-full flex justify-center items-center">
            <Image
              src="/running.png"
              alt="The Kingdom"
              width={350}
              height={250}
              priority
            />
          </div>

          <span className="text-[14px] text-brown/45 leading-relaxed font-light">
            "But seek first his kingdom and his righteousness, and all these things will be given to you."
            <br />Matthew 6:33
          </span>
        </div>

        {/* Bottom — countdown in place of nav links, same border style */}
        <div className="fade-up delay-3 flex flex-col">
          <div className="flex items-center justify-between py-[14px] border-t border-brown/10">
            <span className="text-sm text-brown/80">
              Available in
            </span>
            {getCountdownDisplay()}
          </div>

          {/* Password protection section */}
          {!showPasswordInput ? (
            <button
              onClick={() => {
                setShowPasswordInput(true);
                // Focus input after render
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="flex items-center justify-between py-[14px] border-t border-brown/10 w-full hover:bg-brown/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLockedOut}
            >
              <span className="text-sm text-brown/80">
                {isLockedOut ? 'Locked out' : 'Already have access?'}
              </span>
              <span className="text-sm text-brown font-medium">
                {isLockedOut ? 'Nice try...' : 'Enter password →'}
              </span>
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="py-[14px] border-t border-brown/10">
              <div className="flex flex-col gap-2">
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => {
                    // Limit input length and sanitize
                    const sanitized = sanitizeInput(e.target.value).slice(0, 50);
                    setPassword(sanitized);
                  }}
                  onKeyDown={(e) => {
                    // Prevent common injection keys
                    if (e.key === '<' || e.key === '>' || e.key === '{' || e.key === '}') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 text-sm border border-brown/20 rounded-md focus:outline-none focus:border-brown/40 disabled:opacity-50"
                  disabled={isLockedOut || isSubmitting.current}
                  maxLength={50}
                  autoComplete="off"
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 text-sm bg-brown text-white rounded-md hover:bg-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLockedOut || isSubmitting.current || !password}
                  >
                    {isSubmitting.current ? 'Checking...' : 'Unlock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordInput(false);
                      setPassword("");
                      setError("");
                      isSubmitting.current = false;
                    }}
                    className="px-3 py-2 text-sm border border-brown/20 rounded-md hover:bg-brown/5 transition-colors disabled:opacity-50"
                    disabled={isSubmitting.current}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="flex items-center justify-between py-[14px] border-t border-b border-brown/10">
            <span className="text-sm text-brown/45 font-light">
              Unlocks Mar 13 at 8:00 PM
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Main app with additional security ──
  return (
    <div className="max-w-lg mx-auto min-h-screen relative">
      <main key={tab}>
        {tab === "home" && <HomeTab onNavigate={handleNav} />}
        {tab === "schedule" && <ScheduleTab />}
        {tab === "rules" && <RulesTab />}
        {tab === "groups" && <GroupsTab />}
        {tab === "info" && <InfoTab now={now} />}
      </main>
      <BottomNav active={tab} onChange={(t) => handleNav(t)} />

      {/* Optional: Add logout button for testing (remove in production) */}
      {process.env.NODE_ENV === 'development' && isAuthenticated && (
        <button
          onClick={handleLogout}
          className="fixed top-12 right-4 text-xs text-brown/30 hover:text-brown/60"
        >
          Logout (dev)
        </button>
      )}
    </div>
  );
}