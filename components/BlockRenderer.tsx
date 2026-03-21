"use client";

import type { Block } from "./BlockEditor";
import { ArrowRight } from "lucide-react";

interface BlockRendererProps {
  blocks: Block[];
  primaryColor: string;
  theme: string;
}

export default function BlockRenderer({ blocks, primaryColor, theme }: BlockRendererProps) {
  const isDark    = theme === "dark";
  const textColor = isDark ? "#ededed"               : "#171717";
  const subColor  = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const border    = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const surface   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  if (!blocks || blocks.length === 0) return (
    <p className="text-[15px]" style={{ color: subColor }}>Nothing here yet.</p>
  );

  return (
    <div className="flex flex-col gap-4">
      {blocks.map(block => {
        switch (block.type) {
          case "text":
            return block.content ? (
              <p key={block.id} className="text-[15px] leading-relaxed" style={{ color: textColor }}>
                {block.content}
              </p>
            ) : null;

          case "heading":
            return block.content ? (
              <h3 key={block.id} className="text-[22px] font-semibold tracking-tight mt-2"
                style={{ color: textColor, letterSpacing: "-0.02em" }}>
                {block.content}
              </h3>
            ) : null;

          case "divider":
            return (
              <div key={block.id} className="py-2">
                <div className="h-px w-full" style={{ background: border }} />
              </div>
            );

          case "link":
            return block.url ? (
            <a
                key={block.id}
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-5 py-4 rounded-2xl transition-opacity hover:opacity-80"
                style={{ border: `1px solid ${border}`, background: surface }}
              >
                <span className="text-[15px] font-medium" style={{ color: textColor }}>
                  {block.content || block.url}
                </span>
                <ArrowRight size={15} style={{ color: subColor }} />
              </a>
            ) : null;

          case "image":
            return block.content ? (
              <div key={block.id} className="flex flex-col gap-2">
                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
                  <img
                    src={block.content}
                    alt={block.caption ?? ""}
                    className="w-full object-cover"
                    onError={e => (e.currentTarget.style.display = "none")}
                  />
                </div>
                {block.caption && (
                  <p className="text-[12px] text-center" style={{ color: subColor }}>{block.caption}</p>
                )}
              </div>
            ) : null;

          case "callout":
            return block.content ? (
              <div
                key={block.id}
                className="flex gap-3 px-4 py-3 rounded-xl"
                style={{ background: primaryColor + "12", border: `1px solid ${primaryColor}33` }}
              >
                <span className="text-[16px] shrink-0">💡</span>
                <p className="text-[14px] leading-relaxed" style={{ color: textColor }}>{block.content}</p>
              </div>
            ) : null;

          default:
            return null;
        }
      })}
    </div>
  );
}