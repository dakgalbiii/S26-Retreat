'use client'

import { motion } from 'framer-motion'
import { Smartphone } from 'lucide-react'
import type { Event, Tab } from '@/types'

interface OrganizerPreviewProps {
  event: Event
  tabs: Tab[]
  activeTabId: string
}

export default function OrganizerPreview({
  event,
  tabs,
  activeTabId,
}: OrganizerPreviewProps) {
  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <div className="h-full flex flex-col items-center justify-start bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      {/* Phone Frame */}
      <div className="relative w-full max-w-sm">
        {/* Phone Bezel */}
        <div className="bg-black rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-900">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>

          {/* Screen Content */}
          <div className="aspect-video bg-white dark:bg-slate-950 relative overflow-y-auto">
            {/* Splash / Cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 p-4"
            >
              <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg h-32 flex items-center justify-center">
                <div className="text-center text-white">
                  <p className="text-2xl font-bold">{event.name}</p>
                  {event.eventDate && (
                    <p className="text-xs opacity-90">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab?.id === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab && (
                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                  {activeTab.type === 'schedule' ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Schedule
                      </p>
                      {(activeTab.content as any[])?.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="p-2 bg-slate-100 dark:bg-slate-800 rounded"
                        >
                          <p className="font-medium text-slate-900 dark:text-white">
                            {item.title}
                          </p>
                          {item.startTime && (
                            <p className="text-xs">{item.startTime}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white mb-2">
                        {activeTab.name}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        Content preview will display here once you add blocks.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-black rounded-full"></div>
      </div>

      {/* Indicator */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-6 flex items-center gap-2">
        <Smartphone className="w-3 h-3" />
        Mobile Preview
      </p>
    </div>
  )
}
