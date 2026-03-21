'use client'

import type { Tab } from '@/types'

interface TabNavProps {
  tabs: Tab[]
  activeTabId: string
  onTabSelect: (tabId: string) => void
  primaryColor: string
}

export default function TabNav({
  tabs,
  activeTabId,
  onTabSelect,
  primaryColor,
}: TabNavProps) {
  const visibleTabs = tabs.filter((tab) => tab.isVisible)

  return (
    <nav className="w-full px-3 py-2 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {visibleTabs.map((tab) => {
          const active = tab.id === activeTabId
          return (
            <button
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: active ? primaryColor : 'transparent',
                color: active ? '#fff' : 'rgba(100,116,139,0.9)',
                border: active ? 'none' : '1px solid rgba(148,163,184,0.35)',
              }}
            >
              <span className="mr-1">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
