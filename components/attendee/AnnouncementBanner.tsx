'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Megaphone, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Announcement } from '@/types'

interface AnnouncementBannerProps {
  announcements: Announcement[]
}

export default function AnnouncementBanner({
  announcements,
}: AnnouncementBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const activeAnnouncements = announcements.filter(
    (a) => a.isActive && !dismissedIds.has(a.id)
  )

  if (activeAnnouncements.length === 0) return null

  const latest = activeAnnouncements[0]

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]))
  }

  return (
    <AnimatePresence>
      {latest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-md"
        >
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-start gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bell className="w-5 h-5 shrink-0 mt-0.5" />
            </motion.div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Live Announcement</p>
              <p className="text-sm opacity-95 line-clamp-2">
                {latest.content}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {new Date(latest.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <button
              onClick={() => handleDismiss(latest.id)}
              className="p-1 text-white opacity-80 hover:opacity-100 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Multiple announcements indicator */}
          {activeAnnouncements.length > 1 && (
            <div className="px-4 py-2 bg-blue-700 flex items-center justify-between text-xs">
              <span>
                +{activeAnnouncements.length - 1} more announcement
                {activeAnnouncements.length - 1 !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-600 h-auto px-2 py-1"
              >
                View All
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
