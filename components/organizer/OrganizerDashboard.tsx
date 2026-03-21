'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowRight, Calendar, Users, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import CreateEventForm from './CreateEventForm'
import type { Event } from '@/types'

interface OrganizerDashboardProps {
  events: Event[]
  onCreateEvent: (event: Omit<Event, 'id' | 'organizerId' | 'createdAt' | 'updatedAt'>) => Promise<Event>
  onLogout: () => Promise<void>
}

export default function OrganizerDashboard({
  events,
  onCreateEvent,
  onLogout,
}: OrganizerDashboardProps) {
  const [isCreating, setIsCreating] = useState(false)

  const activeEvents = events.filter(e => e.isActive)
  const archivedEvents = events.filter(e => !e.isActive)

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Prelude
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Event Organizer Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Your Events
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Create and manage live event pages
              </p>
            </div>

            <Button
              onClick={() => setIsCreating(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </div>
        </motion.div>

        {/* Events Grid */}
        {activeEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No events yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first event to get started
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Create First Event
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {activeEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Link href={`/dashboard/events/${event.id}/edit`}>
                    <Card className="overflow-hidden border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer h-full">
                      {/* Cover */}
                      <div
                        className="h-32 relative overflow-hidden"
                        style={{
                          background: event.coverImage
                            ? `url(${event.coverImage}) center / cover`
                            : `linear-gradient(135deg, ${event.accentColor} 0%, ${event.accentColor}dd 100%)`,
                        }}
                      >
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <div className="text-white">
                            <p className="text-xs opacity-75">Click to edit</p>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                          {event.name}
                        </h3>

                        {event.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                            {event.description}
                          </p>
                        )}

                        {event.eventDate && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.eventDate).toLocaleDateString()}
                          </p>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <span className="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full">
                            Live
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-blue-600 hover:text-blue-700"
                          >
                            Edit
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Archived Section */}
        {archivedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Archived Events ({archivedEvents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedEvents.map((event) => (
                <Card
                  key={event.id}
                  className="p-4 border-slate-200 dark:border-slate-700 opacity-60"
                >
                  <h3 className="font-medium text-slate-900 dark:text-white line-clamp-1">
                    {event.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Archived
                  </p>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Event Dialog */}
      <CreateEventForm
        open={isCreating}
        onOpenChange={setIsCreating}
        onSubmit={onCreateEvent}
      />
    </div>
  )
}
