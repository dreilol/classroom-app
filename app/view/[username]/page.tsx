'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { Suspense } from 'react'

// 1. This is your actual Guest View component that uses useParams
function GuestViewContent() {
  const params = useParams()
  
  const [date, setDate] = useState('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  // ... (keep all your existing state variables)
  const [subjects, setSubjects] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // ... (keep all your useEffect hooks exactly as they are)
  useEffect(() => {
    // ... your fetchDates logic
  }, [])

  useEffect(() => {
    // ... your fetchGuestData logic
  }, [date])

  // ... (keep your return statement exactly as it is)
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* ... your entire UI ... */}
    </div>
  )
}

// 2. The Default Export wraps it in Suspense
export default function GuestViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-gray-500">Loading...</div>}>
      <GuestViewContent />
    </Suspense>
  )
}