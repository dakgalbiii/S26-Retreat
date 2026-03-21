import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { groups } from '../lib/groups'
import { schedule } from '../lib/schedule'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function seed() {
  console.log('Seeding event...')

  // 1. Create the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      slug: 'kcf-retreat-2026',
      access_code: 'kcf2026',
      title: 'Seek First The Kingdom',
      tagline: 'KCF Spring Retreat 2026',
      primary_color: '#6366f1',
      theme: 'light',
    })
    .select()
    .single()

  if (eventError) { console.error('Event error:', eventError); return }
  console.log('✓ Event created:', event.id)

  // 2. Seed schedule
  const blocks = schedule.flatMap((day, dayIndex) =>
    day.items.map((item, i) => ({
      event_id: event.id,
      day: dayIndex + 1,
      start_time: item.time,
      title: item.title,
      description: item.subtitle ?? null,
      category: item.highlight ? 'Session' : null,
      position: i,
    }))
  )

  const { error: scheduleError } = await supabase
    .from('schedule_blocks')
    .insert(blocks)

  if (scheduleError) { console.error('Schedule error:', scheduleError); return }
  console.log('✓ Schedule seeded')

  // 3. Seed groups + members
  for (const group of groups) {
    const { data: g, error: groupError } = await supabase
      .from('groups')
      .insert({ event_id: event.id, name: group.name })
      .select()
      .single()

    if (groupError) { console.error('Group error:', groupError); return }

    interface Member {
        group_id: string
        name: string
    }

    const members: Member[] = group.members.map((name: string) => ({
        group_id: g.id,
        name,
    }))

    // also add leader as first member
    members.unshift({ group_id: g.id, name: `${group.leader} (Leader)` })

    const { error: membersError } = await supabase
      .from('members')
      .insert(members)

    if (membersError) { console.error('Members error:', membersError); return }
  }
  console.log('✓ Groups + members seeded')

  console.log('Done! 🎉')
}

seed()