"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme, tokens } from "@/lib/theme/theme-context";
import type { PartialBlock } from "@blocknote/core";

const BlockNoteLabCanvas = dynamic(
  () => import("@/components/organizer/BlockNoteLabCanvas"),
  { ssr: false }
);

const STORAGE_KEY = "prelude:blocknote:lab";

function loadInitialContent(): PartialBlock[] | undefined {
  if (typeof window === "undefined") return undefined;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as PartialBlock[];
  } catch {
    return undefined;
  }
}

export default function BlockNoteLabPage() {
  const { theme } = useTheme();
  const t = tokens(theme);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [initialContent, setInitialContent] = useState<PartialBlock[] | undefined>(undefined);
  const [currentDoc, setCurrentDoc] = useState<unknown>(null);

  const json = JSON.stringify(currentDoc, null, 2);

  useEffect(() => {
    setInitialContent(loadInitialContent());
  }, []);

  return (
    <div className="min-h-full px-4 md:px-8 py-4 md:py-6">
      <div
        className="sticky top-0 z-10 mb-4 px-1 py-2 flex items-center justify-between"
        style={{ background: t.bg }}
      >
        <p className="text-[12px]" style={{ color: t.textFaint }}>
          BlockNote canvas lab {savedAt ? `· saved ${savedAt.toLocaleTimeString()}` : "· unsaved"}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowJson((v) => !v)}
            className="px-3 py-2 rounded-lg text-[12px]"
            style={{ border: `1px solid ${t.border}`, color: t.textSub }}
          >
            {showJson ? "Hide JSON" : "Show JSON"}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }}
            className="px-3 py-2 rounded-lg text-[12px]"
            style={{ border: `1px solid ${t.border}`, color: t.textSub }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-240">
        <BlockNoteLabCanvas
          theme={theme === "dark" ? "dark" : "light"}
          initialContent={initialContent}
          onChange={(doc) => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
            setCurrentDoc(doc);
            setSavedAt(new Date());
          }}
        />
      </div>

      {showJson && (
        <pre
          className="text-[12px] p-2 overflow-auto mt-4 mx-auto max-w-240"
          style={{ color: t.textSub, borderTop: `1px solid ${t.border}` }}
        >
          {json}
        </pre>
      )}
    </div>
  );
}
