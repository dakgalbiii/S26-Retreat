'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Share2, Eye, EyeOff, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TabBuilder from './TabBuilder'
import BlockCanvas from './BlockCanvas'
import ScheduleEditor from './ScheduleEditor'
import AnnouncementPanel from './AnnouncementPanel'
import OrganizerPreview from './OrganizerPreview'
import type { Event, Tab } from '@/types'

interface EventEditorProps {
  event: Event
  onSave: (event: Event) => Promise<void>
  onPublish: () => Promise<void>
  onClose: () => void
}

export default function EventEditor({ event, onSave, onPublish, onClose }: EventEditorProps) {
  const [tabs, setTabs] = useState<Tab[]>(event.tabs || [])
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || '')
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const activeTabData = tabs.find(t => t.id === activeTab)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({ ...event, tabs })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      await onPublish()
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Top Bar */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {event.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {event.description || 'No description'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Preview
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Share2 className="w-4 h-4" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left Sidebar: Tab Manager */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
          <TabBuilder
            tabs={tabs}
            activeTabId={activeTab}
            onTabSelect={setActiveTab}
            onTabsChange={setTabs}
          />
        </div>

        {/* Center: Editor Canvas */}
        <div className="flex-1 overflow-y-auto">
          {activeTabData && (
            <div className="p-8 max-w-4xl">
              {activeTabData.type === 'schedule' ? (
                <ScheduleEditor tab={activeTabData} onUpdate={(updated: Tab) => {
                  setTabs(tabs.map(t => t.id === updated.id ? updated : t))
                }} />
              ) : (
                <BlockCanvas tab={activeTabData} onUpdate={(updated: Tab) => {
                  setTabs(tabs.map(t => t.id === updated.id ? updated : t))
                }} />
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Panels + Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-96 border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Mobile Preview
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <OrganizerPreview event={event} tabs={tabs} activeTabId={activeTab} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Announcement Panel */}
        <div className="fixed bottom-6 right-6 w-80">
          <AnnouncementPanel eventId={event.id} />
        </div>
      </div>
    </div>
  )
}
