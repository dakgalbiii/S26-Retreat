'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Event } from '@/types'

const PRESET_COLORS = [
  { id: 'blue', value: '#3b82f6', label: 'Blue' },
  { id: 'purple', value: '#8b5cf6', label: 'Purple' },
  { id: 'pink', value: '#ec4899', label: 'Pink' },
  { id: 'red', value: '#ef4444', label: 'Red' },
  { id: 'orange', value: '#f97316', label: 'Orange' },
  { id: 'green', value: '#10b981', label: 'Green' },
  { id: 'indigo', value: '#6366f1', label: 'Indigo' },
  { id: 'slate', value: '#64748b', label: 'Slate' },
]

interface CreateEventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (event: Omit<Event, 'id' | 'organizerId' | 'createdAt' | 'updatedAt'>) => Promise<Event>
}

export default function CreateEventForm({
  open,
  onOpenChange,
  onSubmit,
}: CreateEventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventDate: '',
    location: '',
    accentColor: '#3b82f6',
    accessCode: generateAccessCode(),
  })

  function generateAccessCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description || undefined,
        eventDate: formData.eventDate || undefined,
        location: formData.location || undefined,
        accentColor: formData.accentColor,
        accessCode: formData.accessCode,
        isActive: true,
      } as any)
      onOpenChange(false)
      setFormData({
        name: '',
        description: '',
        eventDate: '',
        location: '',
        accentColor: '#3b82f6',
        accessCode: generateAccessCode(),
      })
    } catch (error) {
      console.error('Failed to create event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Set up your event page in minutes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Event Name */}
          <div>
            <Label htmlFor="event-name" className="text-sm font-medium mb-2 block">
              Event Name *
            </Label>
            <Input
              id="event-name"
              placeholder="Tech Summit, Annual Gala, etc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="event-desc" className="text-sm font-medium mb-2 block">
              Description
            </Label>
            <Textarea
              id="event-desc"
              placeholder="Brief description of your event..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="event-date" className="text-sm font-medium mb-2 block">
                Date & Time
              </Label>
              <Input
                id="event-date"
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="event-location" className="text-sm font-medium mb-2 block">
                Location
              </Label>
              <Input
                id="event-location"
                placeholder="Venue or address"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Brand Color
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, accentColor: color.value })}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    formData.accentColor === color.value
                      ? 'border-slate-900 dark:border-white scale-105'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Access Code */}
          <div>
            <Label htmlFor="access-code" className="text-sm font-medium mb-2 block">
              Access Code
            </Label>
            <div className="flex gap-2">
              <Input
                id="access-code"
                value={formData.accessCode}
                readOnly
                className="font-mono bg-slate-50 dark:bg-slate-900 text-center font-semibold tracking-wider"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({ ...formData, accessCode: generateAccessCode() })}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Share this code with attendees
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
