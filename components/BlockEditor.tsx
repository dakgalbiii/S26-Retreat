"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  GripVertical, Trash2, Plus, Type, Heading2,
  Minus, Link as LinkIcon, Image, AlertCircle, ChevronDown,
} from "lucide-react";
import { tokens } from "@/lib/theme/theme-context";

// ── Types ─────────────────────────────────────────────────────────────────────
export type BlockType = "text" | "heading" | "divider" | "link" | "image" | "callout"

export type Block = {
  id: string;
  type: BlockType;
  content: string;   // text/heading/callout body, link label, image url
  url?: string;      // link href
  caption?: string;  // image caption
}

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  t: ReturnType<typeof tokens>;
  isDark: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyBlock(type: BlockType): Block {
  return { id: uid(), type, content: "", url: "" };
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: "text",    label: "Text",     icon: Type,        desc: "Plain paragraph" },
  { type: "heading", label: "Heading",  icon: Heading2,    desc: "Section title"   },
  { type: "divider", label: "Divider",  icon: Minus,       desc: "Horizontal rule" },
  { type: "link",    label: "Link",     icon: LinkIcon,    desc: "Button with URL" },
  { type: "image",   label: "Image",    icon: Image,       desc: "Image from URL"  },
  { type: "callout", label: "Callout",  icon: AlertCircle, desc: "Highlight box"   },
]

// ── Block row ─────────────────────────────────────────────────────────────────
function BlockRow({ block, t, isDark, onChange, onDelete, onEnter }: {
  block: Block;
  t: ReturnType<typeof tokens>;
  isDark: boolean;
  onChange: (b: Block) => void;
  onDelete: () => void;
  onEnter: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const baseInput: React.CSSProperties = {
    background:  "transparent",
    border:      "none",
    outline:     "none",
    color:       t.text,
    width:       "100%",
    resize:      "none",
    fontFamily:  "inherit",
    lineHeight:  "1.6",
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    }
    if (e.key === "Backspace" && block.content === "" && block.type !== "divider") {
      e.preventDefault();
      onDelete();
    }
  }

  // Auto-resize textarea
  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  const renderBlock = () => {
    switch (block.type) {
      case "text":
        return (
          <textarea
            ref={inputRef}
            value={block.content}
            placeholder="Write something..."
            rows={1}
            style={{ ...baseInput, fontSize: "14px", minHeight: "24px" }}
            onChange={e => { autoResize(e.target); onChange({ ...block, content: e.target.value }); }}
            onKeyDown={handleKeyDown}
          />
        );

      case "heading":
        return (
          <textarea
            ref={inputRef}
            value={block.content}
            placeholder="Heading"
            rows={1}
            style={{ ...baseInput, fontSize: "20px", fontWeight: 600, letterSpacing: "-0.02em", minHeight: "28px" }}
            onChange={e => { autoResize(e.target); onChange({ ...block, content: e.target.value }); }}
            onKeyDown={handleKeyDown}
          />
        );

      case "divider":
        return (
          <div className="flex items-center w-full py-2">
            <div className="flex-1 h-px" style={{ background: t.border }} />
          </div>
        );

      case "link":
        return (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={block.content}
              placeholder="Button label"
              style={{ ...baseInput, fontSize: "14px", fontWeight: 500 }}
              onChange={e => onChange({ ...block, content: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
            />
            <input
              type="url"
              value={block.url ?? ""}
              placeholder="https://..."
              style={{ ...baseInput, fontSize: "12px", color: t.textFaint, fontFamily: "monospace" }}
              onChange={e => onChange({ ...block, url: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
            />
          </div>
        );

      case "image":
        return (
          <div className="flex flex-col gap-2 w-full">
            <input
              type="url"
              value={block.content}
              placeholder="Image URL (https://...)"
              style={{ ...baseInput, fontSize: "13px", fontFamily: "monospace", color: t.textSub }}
              onChange={e => onChange({ ...block, content: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
            />
            {block.content && (
              <div className="rounded-xl overflow-hidden mt-1" style={{ border: `1px solid ${t.border}` }}>
                <img
                  src={block.content}
                  alt={block.caption ?? ""}
                  className="w-full object-cover max-h-64"
                  onError={e => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}
            <input
              type="text"
              value={block.caption ?? ""}
              placeholder="Caption (optional)"
              style={{ ...baseInput, fontSize: "12px", color: t.textFaint }}
              onChange={e => onChange({ ...block, caption: e.target.value })}
            />
          </div>
        );

      case "callout":
        return (
          <div
            className="flex gap-3 w-full px-4 py-3 rounded-xl"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${t.border}` }}
          >
            <span className="text-[16px] shrink-0">💡</span>
            <textarea
              ref={inputRef}
              value={block.content}
              placeholder="Add a callout..."
              rows={1}
              style={{ ...baseInput, fontSize: "14px", minHeight: "24px" }}
              onChange={e => { autoResize(e.target); onChange({ ...block, content: e.target.value }); }}
              onKeyDown={handleKeyDown}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex items-start gap-2 group w-full">
      {/* Drag handle + delete */}
      <div className="flex flex-col items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          style={{ color: t.textFaint, cursor: "grab", touchAction: "none" }}
          className="p-0.5 rounded hover:opacity-70"
        >
          <GripVertical size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-0.5 rounded hover:opacity-70"
          style={{ color: t.textFaint }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Block content */}
      <div className="flex-1 min-w-0">
        {renderBlock()}
      </div>
    </div>
  );
}

// ── Add block menu ────────────────────────────────────────────────────────────
function AddBlockMenu({ t, isDark, onAdd }: {
  t: ReturnType<typeof tokens>;
  isDark: boolean;
  onAdd: (type: BlockType) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-opacity hover:opacity-70"
        style={{ border: `1px dashed ${t.border}`, color: t.textFaint, width: "100%" }}
      >
        <Plus size={14} />
        Add block
        <ChevronDown size={12} style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-20 mt-1 rounded-xl overflow-hidden"
            style={{ background: isDark ? "#1e1e1e" : "#fff", border: `1px solid ${t.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
          >
            {BLOCK_TYPES.map(bt => {
              const Icon = bt.icon;
              return (
                <button
                  key={bt.type}
                  onClick={() => { onAdd(bt.type); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-70"
                  style={{ borderBottom: `1px solid ${t.border}` }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: t.surface }}>
                    <Icon size={14} style={{ color: t.textSub }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: t.text }}>{bt.label}</p>
                    <p className="text-[11px]" style={{ color: t.textFaint }}>{bt.desc}</p>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main BlockEditor ──────────────────────────────────────────────────────────
export default function BlockEditor({ blocks, onChange, t, isDark }: BlockEditorProps) {
  function addBlock(type: BlockType, afterIndex?: number) {
    const nb = emptyBlock(type);
    if (afterIndex === undefined) {
      onChange([...blocks, nb]);
    } else {
      const next = [...blocks];
      next.splice(afterIndex + 1, 0, nb);
      onChange(next);
    }
    // Focus the new block after render
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLElement>(`[data-block-id="${nb.id}"]`);
      inputs[0]?.focus();
    }, 50);
  }

  function updateBlock(id: string, updated: Block) {
    onChange(blocks.map(b => b.id === id ? updated : b));
  }

  function deleteBlock(id: string) {
    const idx = blocks.findIndex(b => b.id === id);
    const next = blocks.filter(b => b.id !== id);
    onChange(next);
    // Focus previous block
    if (idx > 0) {
      setTimeout(() => {
        const prev = next[idx - 1];
        const el = document.querySelector<HTMLElement>(`[data-block-id="${prev?.id}"]`);
        el?.focus();
      }, 50);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Reorder.Group
        axis="y"
        values={blocks}
        onReorder={onChange}
        className="flex flex-col gap-2"
      >
        <AnimatePresence mode="popLayout">
          {blocks.map((block, i) => (
            <Reorder.Item
              key={block.id}
              value={block}
              style={{ listStyle: "none" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
            >
              <BlockRow
                block={block}
                t={t}
                isDark={isDark}
                onChange={updated => updateBlock(block.id, updated)}
                onDelete={() => deleteBlock(block.id)}
                onEnter={() => addBlock("text", i)}
              />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {blocks.length === 0 && (
        <p className="text-[13px] text-center py-6" style={{ color: t.textFaint }}>
          No blocks yet. Add one below.
        </p>
      )}

      <div className="mt-2">
        <AddBlockMenu t={t} isDark={isDark} onAdd={type => addBlock(type)} />
      </div>
    </div>
  );
}