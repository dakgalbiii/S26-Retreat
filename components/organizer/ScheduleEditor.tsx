'use client'

import { useState } from 'react'
import { Reorder, AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, GripVertical, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { Tab, ScheduleItem, ScheduleItemWithId } from '@/types'

interface ScheduleEditorProps {
  tab: Tab
  onUpdate: (tab: Tab) => void
}

export default function ScheduleEditor({ tab, onUpdate }: ScheduleEditorProps) {
  const [items, setItems] = useState<ScheduleItemWithId[]>(
    (tab.content as ScheduleItemWithId[]) || []
  )
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
  })

  const handleAddItem = () => {
    if (!formData.title.trim()) return

    const newItem: ScheduleItemWithId = {
      id: Math.random().toString(36).slice(2),
      tabId: tab.id,
      title: formData.title,
      description: formData.description || null,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location || null,
      position: items.length,
    }

    const updated = [...items, newItem]
    setItems(updated)
    onUpdate({ ...tab, content: updated })
    setFormData({ title: '', description: '', startTime: '', endTime: '', location: '' })
    setIsAdding(false)
  }

  const handleDeleteItem = (id: string) => {
    const updated = items.filter(item => item.id !== id)
    setItems(updated)
    onUpdate({ ...tab, content: updated })
  }

  const handleReorder = (reordered: ScheduleItemWithId[]) => {
    const updated = reordered.map((item, i) => ({ ...item, position: i }))
    setItems(updated)
    onUpdate({ ...tab, content: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {tab.name}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {items.length} items
        </p>
      </div>

      <Button
        onClick={() => setIsAdding(true)}
        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Plus className="w-4 h-4" />
        Add Time Slot
      </Button>

      {/* Schedule Items */}
      <Reorder.Group
        values={items}
        onReorder={handleReorder}
        as="div"
        className="space-y-3"
      >
        <AnimatePresence>
          {items.map((item) => (
            <Reorder.Item key={item.id} value={item}>
              <motion.div
                layout
                className="group flex items-start gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <GripVertical className="w-5 h-5 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600 dark:text-slate-400">
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

                  {item.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {item.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add Item Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Add Schedule Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Title *
              </label>
              <Input
                placeholder="Opening remarks, Lunch break, etc."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                  End Time
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Location
              </label>
              <Input
                placeholder="Room 101, Main Stage, etc."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Description
              </label>
              <Textarea
                placeholder="Optional details..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsAdding(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={!formData.title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
