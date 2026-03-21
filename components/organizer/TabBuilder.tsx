'use client'

import { useState } from 'react'
import { Reorder, AnimatePresence, motion } from 'framer-motion'
import { Plus, GripVertical, Trash2, Edit2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Tab } from '@/types'

interface TabBuilderProps {
  tabs: Tab[]
  activeTabId: string
  onTabSelect: (id: string) => void
  onTabsChange: (tabs: Tab[]) => void
}

const BUILTIN_TABS = ['schedule']
const TAB_ICONS = ['📅', '📝', '🔗', 'ℹ️', '📣', '👥', '🎯', '⭐']

export default function TabBuilder({
  tabs,
  activeTabId,
  onTabSelect,
  onTabsChange,
}: TabBuilderProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTabName, setNewTabName] = useState('')
  const [newTabIcon, setNewTabIcon] = useState('📝')

  const handleAddTab = () => {
    if (!newTabName.trim()) return

    const newTab: Tab = {
      id: Math.random().toString(36).slice(2),
      eventId: '',
      name: newTabName,
      icon: newTabIcon,
      type: 'canvas',
      position: tabs.length,
      isVisible: true,
      content: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onTabsChange([...tabs, newTab])
    onTabSelect(newTab.id)
    setNewTabName('')
    setIsAdding(false)
  }

  const handleDeleteTab = (tabId: string) => {
    const filtered = tabs.filter(t => t.id !== tabId)
    onTabsChange(filtered)
    if (activeTabId === tabId) {
      onTabSelect(filtered[0]?.id || '')
    }
  }

  const handleReorder = (reordered: Tab[]) => {
    const updated = reordered.map((t, i) => ({ ...t, position: i }))
    onTabsChange(updated)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Tabs Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Pages
        </h3>
        <Button
          onClick={() => setIsAdding(true)}
          size="sm"
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Page
        </Button>
      </div>

      {/* Tabs List */}
      <Reorder.Group values={tabs} onReorder={handleReorder} as="div" className="flex-1 overflow-y-auto space-y-1 p-3">
        <AnimatePresence>
          {tabs.map((tab) => (
            <Reorder.Item key={tab.id} value={tab}>
              <motion.div
                layout
                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all group ${
                  activeTabId === tab.id
                    ? 'bg-white dark:bg-slate-800 shadow-sm border border-blue-200 dark:border-blue-900'
                    : 'hover:bg-white dark:hover:bg-slate-800 border border-transparent'
                }`}
                onClick={() => onTabSelect(tab.id)}
              >
                <GripVertical className="w-4 h-4 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <span className="text-lg shrink-0">{tab.icon}</span>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {tab.name}
                  </p>
                  {BUILTIN_TABS.includes(tab.type) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTab(tab.id)
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add Tab Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Add New Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Page Name
              </label>
              <Input
                placeholder="Links, FAQ, Sponsors..."
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Icon
              </label>
              <Select value={newTabIcon} onValueChange={setNewTabIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAB_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                onClick={handleAddTab}
                disabled={!newTabName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
