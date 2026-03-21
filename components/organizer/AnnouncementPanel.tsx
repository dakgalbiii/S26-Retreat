'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import type { Announcement } from '@/types'

interface AnnouncementPanelProps {
  eventId: string
}

export default function AnnouncementPanel({ eventId }: AnnouncementPanelProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // Replace with actual Supabase fetch
        const mockAnnouncements: Announcement[] = [
          {
              id: '1',
              eventId: 'default',
              content: 'Welcome to the event! Check back for updates.',
              createdAt: new Date().toISOString(),
              isActive: true,
          },
        ]
        setAnnouncements(mockAnnouncements)
      } catch (error) {
        console.error('Failed to fetch announcements:', error)
      }
    }

    fetchAnnouncements()
  }, [eventId])

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.trim()) return

    setIsLoading(true)
    try {
      // Replace with actual Supabase insert
      const announcement: Announcement = {
        id: Math.random().toString(36).slice(2),
        eventId: eventId,
        content: newAnnouncement,
        createdAt: new Date().toISOString(),
        isActive: true,
      }

      setAnnouncements([announcement, ...announcements])
      setNewAnnouncement('')
    } catch (error) {
      console.error('Failed to post announcement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      // Replace with actual Supabase delete
      setAnnouncements(announcements.filter(a => a.id !== id))
    } catch (error) {
      console.error('Failed to delete announcement:', error)
    }
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Live Announcement
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Input */}
        <div>
          <Textarea
            placeholder="Post a live update to attendees..."
            value={newAnnouncement}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAnnouncement(e.target.value)}
            className="resize-none text-sm"
            rows={3}
          />
        </div>

        <Button
          onClick={handlePostAnnouncement}
          disabled={!newAnnouncement.trim() || isLoading}
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Send className="w-4 h-4" />
          {isLoading ? 'Posting...' : 'Post Now'}
        </Button>

        {/* Recent Announcements */}
        {announcements.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Recent
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <AnimatePresence>
                {announcements.slice(0, 3).map((announcement) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="group p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                        {announcement.content}
                      </p>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                      {new Date(announcement.createdAt).toLocaleTimeString()}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
