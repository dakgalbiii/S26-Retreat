'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Clock, MapPin, Phone, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Tab, ScheduleItem, ScheduleItemWithId } from '@/types'

interface ScheduleViewProps {
  tab: Tab
  primaryColor: string
}

export default function ScheduleView({ tab, primaryColor }: ScheduleViewProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const items = (tab.content as ScheduleItemWithId[]) || []

  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <Card className="p-8 text-center border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No schedule items yet
          </p>
        </Card>
      ) : (
        items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow">
              <button
                onClick={() => toggleExpand(item.id)}
                className="w-full text-left p-4"
                style={{
                  borderLeftColor: primaryColor,
                  borderLeftWidth: '4px',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                      {item.startTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {item.startTime}
                          {item.endTime && ` – ${item.endTime}`}
                        </div>
                      )}
                      {item.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {item.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${
                      expandedItem === item.id ? 'transform rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedItem === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-200 dark:border-slate-700"
                  >
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 space-y-3">
                      {item.description && (
                        <div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {item.description}
                          </p>
                        </div>
                      )}

                      {item.location && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                        >
                          <MapPin className="w-4 h-4" />
                          Get Directions
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  )
}
