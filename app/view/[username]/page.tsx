'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

// This is the inner component that uses useParams()
function GuestViewContent() {
  const params = useParams()
  
  const [date, setDate] = useState('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // ... (Keep all your existing useEffect hooks here exactly as they are)
  // ... (Keep your existing return statement with the UI here exactly as it is)
  
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Your UI goes here */}
    </div>
  )
}

// This is the default export that wraps everything in Suspense
export default function GuestViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-gray-500">Loading...</div>}>
      <GuestViewContent />
    </Suspense>
  )
}