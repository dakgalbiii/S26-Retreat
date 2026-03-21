'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Tab } from '@/types'

interface BlockCanvasProps {
  tab: Tab
  onUpdate: (tab: Tab) => void
}

// BlockNote integration - will be installed via npm
// For now, we'll use a placeholder that shows the integration point
export default function BlockCanvas({ tab, onUpdate }: BlockCanvasProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [content, setContent] = useState(tab.content || [])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save on content change (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSaving(true)
      try {
        // Simulate API call - replace with actual Supabase update
        onUpdate({
          ...tab,
          content,
          updatedAt: new Date().toISOString(),
        })
        setLastSaved(new Date())
      } finally {
        setIsSaving(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [content, tab, onUpdate])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {tab.name}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'Draft'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
        </div>
      </div>

      {/* BlockNote Editor Placeholder */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 min-h-125 bg-slate-50 dark:bg-slate-900">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>BlockNote Integration:</strong> Install with <code className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">npm install @blocknote/core @blocknote/react @blocknote/mantine</code>
            <p className="mt-2 text-xs">
              Once installed, replace this placeholder with the actual BlockNote editor component.
            </p>
          </AlertDescription>
        </Alert>

        <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-300 font-mono">
            &lt;BlockNoteView editor=&#123;editor&#125; /&gt;
          </p>
        </div>
      </div>

      {/* Block Type Selector */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Supported Blocks
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['📝 Text', '🎯 Heading', '🔗 Link', '🖼️ Image'].map((type) => (
            <button
              key={type}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
