'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Event } from '@/types'

interface AccessCodeFormProps {
  event: Event
  onAccessGranted: () => void
}

export default function AccessCodeForm({
  event,
  onAccessGranted,
}: AccessCodeFormProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Replace with actual Supabase verification
      if (code === event.accessCode) {
        // Cache the access code in localStorage
        localStorage.setItem(
          `prelude_access_${event.id}`,
          'true'
        )
        onAccessGranted()
        router.push(`/e/${event.id}/schedule`)
      } else {
        setError('Invalid access code. Please try again.')
        setCode('')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <Lock className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Access Event
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enter your access code to view the event page
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Enter access code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isLoading}
            autoFocus
            maxLength={6}
            className="text-center text-lg font-semibold letter-spacing tracking-wider"
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Button
          type="submit"
          disabled={code.length === 0 || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Checking...' : 'Enter Event'}
        </Button>
      </form>

      <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
        Your code will be saved on this device
      </p>
    </motion.div>
  )
}
