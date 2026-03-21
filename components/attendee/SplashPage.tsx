'use client'

import { motion } from 'framer-motion'
import { Calendar, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { Event } from '@/types'

interface SplashPageProps {
  event: Event
}

export default function SplashPage({ event }: SplashPageProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-md mx-auto space-y-6 pb-12"
    >
      {/* Cover Image / Gradient */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl shadow-xl"
      >
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div
            className="w-full h-64 flex items-center justify-center text-white"
            style={{
              background: `linear-gradient(135deg, ${event.accentColor} 0%, ${event.accentColor}dd 100%)`,
            }}
          >
            <div className="text-center">
              <p className="text-sm opacity-90">Event</p>
            </div>
          </div>
        )}

        {/* Overlay with Info */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end p-6">
          <div className="text-white w-full">
            <motion.h1
              variants={item}
              className="text-3xl font-bold mb-2"
            >
              {event.name}
            </motion.h1>
            {event.description && (
              <motion.p
                variants={item}
                className="text-sm opacity-90"
              >
                {event.description}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Event Details */}
      <motion.div variants={item} className="space-y-3">
        {event.eventDate && (
          <Card className="p-4 border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Date & Time
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {new Date(event.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {new Date(event.eventDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Location if available */}
        {event.location && (
          <Card className="p-4 border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Location
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {event.location}
                </p>
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Call to Action */}
      <motion.div
        variants={item}
        className="pt-4 border-t border-slate-200 dark:border-slate-800"
      >
        <p className="text-sm text-center text-slate-600 dark:text-slate-400">
          👇 Swipe down to see the full schedule
        </p>
      </motion.div>
    </motion.div>
  )
}
