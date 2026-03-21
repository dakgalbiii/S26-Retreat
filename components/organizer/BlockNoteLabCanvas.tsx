"use client";

import { useMemo } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { PartialBlock } from "@blocknote/core";

interface BlockNoteLabCanvasProps {
  theme: "light" | "dark";
  initialContent?: PartialBlock[];
  onChange: (doc: unknown) => void;
}

export default function BlockNoteLabCanvas({
  theme,
  initialContent,
  onChange,
}: BlockNoteLabCanvasProps) {
  const memoInitial = useMemo(() => initialContent, [initialContent]);

  const editor = useCreateBlockNote({
    initialContent: memoInitial,
  });

  return (
    <BlockNoteView
      editor={editor}
      theme={theme}
      onChange={() => {
        onChange(editor.document);
      }}
    />
  );
}
