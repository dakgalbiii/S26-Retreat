// Core Event Types
export interface Event {
  id: string
  organizerId: string
  name: string
  description?: string
  eventDate?: string
  location?: string
  coverImage?: string
  accentColor: string
  accessCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  tabs?: Tab[]
}

// Tab Types
export type TabType = 'schedule' | 'canvas'

export interface Tab {
  id: string
  eventId: string
  name: string
  icon: string
  type: TabType
  position: number
  isVisible: boolean
  content: any[] // BlockNote JSON or array of ScheduleItems
  createdAt: string
  updatedAt: string
}

// Schedule Types
export interface ScheduleItem {
  id: string
  tabId: string
  title: string
  description?: string | null
  startTime?: string
  endTime?: string
  location?: string | null
  position: number
}

export interface ScheduleItemWithId extends ScheduleItem {
  id: string
  tabId: string
}

// Announcement Types
export interface Announcement {
  id: string
  eventId: string
  content: string
  isActive: boolean
  createdAt: string
}

// Block Types (for BlockNote content)
export type BlockType = 'text' | 'heading' | 'link' | 'image' | 'bullet' | 'divider'

export interface Block {
  id: string
  type: BlockType
  content: string
  url?: string
  caption?: string
}

// Auth Types
export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

// Dashboard Types
export interface OrganizerDashboard {
  events: Event[]
  totalEvents: number
  recentEvents: Event[]
}

// Responses
export interface ApiResponse<T> {
  data: T
  error?: string
  status: number
}
