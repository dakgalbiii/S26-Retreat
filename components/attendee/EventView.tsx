'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp } from 'lucide-react'
import TabNav from './TabNav'
import SplashPage from './SplashPage'
import ScheduleView from './ScheduleView'
import AnnouncementBanner from './AnnouncementBanner'
import type { Event, Tab, Announcement } from '@/types'

interface EventViewProps {
  event: Event
  tabs: Tab[]
  announcements: Announcement[]
  onAnnouncementUpdate?: (announcements: Announcement[]) => void
}

export default function EventView({
  event,
  tabs,
  announcements,
  onAnnouncementUpdate,
}: EventViewProps) {
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0]?.id || '')
  const [showSplash, setShowSplash] = useState(true)
  const [scrollProgress, setScrollProgress] = useState(0)

  const activeTab = tabs.find(t => t.id === activeTabId)

  // Track scroll for splash dismissal
  useEffect(() => {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement
      const progress = target.scrollTop / (target.scrollHeight - target.clientHeight)
      setScrollProgress(progress)
      if (progress > 0.1) {
        setShowSplash(false)
      }
    }

    const scrollContainer = document.getElementById('event-view-scroll')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll as any)
      return () => scrollContainer.removeEventListener('scroll', handleScroll as any)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      {/* Announcement Banner */}
      {announcements.length > 0 && (
        <AnnouncementBanner announcements={announcements} />
      )}

      {/* Scroll Container */}
      <div
        id="event-view-scroll"
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
          {/* Splash Page */}
          {showSplash && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SplashPage event={event} />
            </motion.div>
          )}

          {/* Tab Content */}
          {activeTab && (
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {activeTab.type === 'schedule' ? (
                <ScheduleView
                  tab={activeTab}
                  primaryColor={event.accentColor || '#3b82f6'}
                />
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    {activeTab.name}
                  </h2>
                  <div className="text-slate-600 dark:text-slate-400">
                    {/* Render BlockNote content here */}
                    <p className="text-sm">
                      Custom content will display here
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Bottom Spacing */}
          <div className="h-24" />
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <div className="sticky bottom-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <TabNav
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabId}
          primaryColor={event.accentColor || '#3b82f6'}
        />
      </div>

      {/* Scroll to Top Button */}
      {scrollProgress > 0.2 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={() => {
            document.getElementById('event-view-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="fixed bottom-24 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  )
}
