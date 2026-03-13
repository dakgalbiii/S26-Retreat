"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import BottomNav from "./components/BottomNav";
import HomeTab from "./components/tabs/HomeTab";
import ScheduleTab from "./components/tabs/ScheduleTab";
import RulesTab from "./components/tabs/RulesTab";
import GroupsTab from "./components/tabs/GroupsTab";
import InfoTab from "./components/tabs/InfoTab";
import RoomsTab from "./components/tabs/RoomTab";
import { Check, Circle } from "lucide-react";

type Tab = "home" | "schedule" | "rules" | "groups" | "info" | "rooms";

const UNLOCK_DATE = new Date("2026-03-13T19:00:00");
const PASSWORD_HASH = btoa("PMTisKindaChinese");
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// Storage keys
const STORAGE_KEYS = {
  AUTHENTICATED: 'retreat_auth',
  ATTEMPTS: 'retreat_attempts',
  LOCKOUT_UNTIL: 'retreat_lockout',
  PACKING_LIST: 'retreat_packing_list',
};

// Packing list items
const PACKING_ITEMS = [
  { id: "bible", label: "Bible (physical ones are preferred)" },
  { id: "journal", label: "Journal" },
  { id: "pen", label: "Pen/pencil" },
  { id: "water", label: "Reusable water bottle (limited plastic bottles available)" },
  { id: "toiletries", label: "Toiletries/medications" },
  { id: "sleeping", label: "Sleeping bag/pillow", optional: true },
  { id: "towel", label: "Towel" },
  { id: "slippers", label: "Slippers and/or shower slippers" },
  { id: "sneakers", label: "Sneakers and activewear (for games)" },
  { id: "money", label: "Spending money (for meals on the way there/back with your car)" },
  { id: "snacks", label: "OPTIONAL: snacks for your car rides & your lovely drivers", optional: true },
];

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
  
  // Packing list state
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showPackingList, setShowPackingList] = useState(false);

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

    // Load packing list state
    const savedPacking = localStorage.getItem(STORAGE_KEYS.PACKING_LIST);
    if (savedPacking) {
      try {
        const parsed = JSON.parse(savedPacking);
        setCheckedItems(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse saved packing list:', e);
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

  // Persist packing list
  useEffect(() => {
    if (mounted) {
      const array = Array.from(checkedItems);
      localStorage.setItem(STORAGE_KEYS.PACKING_LIST, JSON.stringify(array));
    }
  }, [checkedItems, mounted]);

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
    const validTabs: Tab[] = ["home", "schedule", "rules", "groups", "info", "rooms"];
    if (validTabs.includes(t as Tab)) {
      setTab(t as Tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Sanitize input to prevent injection
  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>{}()\[\]\\]/g, '').trim();
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

  // Packing list functions
  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (!mounted) return null;

  const isLocked = now < UNLOCK_DATE && !isAuthenticated;

  // ── Pre-retreat lock screen — with packing list ──
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

    const totalItems = PACKING_ITEMS.length;
    const completedCount = checkedItems.size;
    const progress = (completedCount / totalItems) * 100;

    return (
      <div className="max-w-lg mx-auto flex flex-col min-h-dvh px-7 pt-16 pb-10">
        {/* Top section */}
        <div className="fade-up delay-1">
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
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto max-w-[350px]"
              priority
            />
          </div>
        </div>

        {/* Toggle between countdown and packing list */}
        <div className="fade-up delay-2 mt-4">
          <div className="flex gap-2 mb-4 ">
            <button
              onClick={() => setShowPackingList(false)}
              className={`flex-1 py-2 text-xs uppercase tracking-widest rounded-lg transition-all ${
                !showPackingList 
                  ? 'bg-brown text-paper font-medium' 
                  : 'text-brown/30 hover:text-brown/50'
              }`}
            >
              Countdown
            </button>
            <button
              onClick={() => setShowPackingList(true)}
              className={`flex-1 py-2 text-xs uppercase tracking-widest rounded-lg transition-all ${
                showPackingList 
                  ? 'bg-brown text-paper font-medium' 
                  : 'text-brown/30 hover:text-brown/50'
              }`}
            >
              Packing List
            </button>
          </div>

          {!showPackingList ? (
            /* Countdown View */
            <div className="flex flex-col">
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
                        const sanitized = sanitizeInput(e.target.value).slice(0, 50);
                        setPassword(sanitized);
                        setError("");
                      }}
                      onPaste={(e) => {}}
                      onKeyDown={(e) => {
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
                  Unlocks Mar 13 at 7:00 PM
                </span>
              </div>
            </div>
          ) : (
            /* Packing List View */
            <div className="flex flex-col py-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-brown mb-2">What to Pack</h3>
                
                {/* Progress bar */}
                <div className="mt-3 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-brown/40">
                      {completedCount} of {totalItems} items packed
                    </span>
                  </div>
                  <div className="h-1.5 bg-brown/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gold rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Packing list items */}
                <div className="space-y-2 pr-2">
                  {PACKING_ITEMS.map((item) => {
                    const isChecked = checkedItems.has(item.id);
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-start gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-brown/5"
                      >
                        <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                          isChecked 
                            ? 'bg-gold border-gold' 
                            : 'border-brown/30'
                        }`}>
                          {isChecked && <Check size={12} className="text-paper" />}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-xs transition-all duration-200 ${
                            isChecked 
                              ? 'text-brown/40 line-through' 
                              : 'text-brown'
                          }`}>
                            {item.label}
                          </p>
                          {item.optional && (
                            <span className="text-[8px] text-brown/30 uppercase tracking-wider mt-1 inline-block">
                              Optional
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer note */}
                <div className="mt-6 p-3 bg-brown/5 rounded-lg">
                  <p className="text-[10px] text-brown/40 leading-relaxed text-center">
                    ✓ Your checklist is saved automatically
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main app ──
  return (
    <div className="max-w-lg mx-auto min-h-screen relative">
      <main key={tab}>
        {tab === "home" && <HomeTab onNavigate={handleNav} />}
        {tab === "schedule" && <ScheduleTab />}
        {tab === "rules" && <RulesTab />}
        {tab === "groups" && <GroupsTab />}
        {tab === "info" && <InfoTab now={now} />}
        {tab === "rooms" && <RoomsTab />}
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