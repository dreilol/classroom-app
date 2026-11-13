'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import AppHeader from '@/app/components/AppHeader'

// 1. The Inner Component (contains all logic and UI)
function GuestViewContent() {
  const params = useParams()
  
  const [date, setDate] = useState('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch available dates, then set the latest one as default
  useEffect(() => {
    const fetchDates = async () => {
      const { data: attDates } = await supabase.from('attendance').select('date')
      const { data: recDates } = await supabase.from('recitation').select('date')
      
      const allDates = [
        ...(attDates?.map(a => a.date) || []),
        ...(recDates?.map(r => r.date) || [])
      ]
      const uniqueDates = Array.from(new Set(allDates)).sort((a, b) => b.localeCompare(a)) 
      
      setAvailableDates(uniqueDates)
      if (uniqueDates.length > 0) setDate(uniqueDates[0]) 
      else setLoading(false)
    }
    fetchDates()
  }, [])

  // Fetch all data when date changes
  useEffect(() => {
    if (!date) return
    setLoading(true)

    const fetchGuestData = async () => {
      const { data: subs } = await supabase.from('subjects').select('*').eq('archived', false)
      const { data: stds } = await supabase.from('students').select('*').eq('archived', false)
      
      if (subs) setSubjects(subs)
      if (stds) setStudents(stds)

      const { data: att } = await supabase.from('attendance').select('*').eq('date', date)
      
      let allRecords: any[] = []
      if (att) allRecords = [...allRecords, ...att]

      const { data: rec } = await supabase.from('recitation').select('*').eq('date', date)
      if (rec) allRecords = [...allRecords, ...rec]
      
      setRecords(allRecords)

      const { data: nts } = await supabase.from('daily_notes').select('*').eq('date', date)
      if (nts) setNotes(nts)

      setLoading(false)
    }

    fetchGuestData()
  }, [date])

  return (
    <div className="min-h-screen"><AppHeader /><div className="page-container">
      <div className="mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="hero-panel text-center">
          <h1 className="text-2xl font-bold">Class Daily Digest</h1>
          <p className="text-slate-300 mt-1">Attendance & Recitation Records</p>
        </div>

        {/* Date Dropdown */}
        <div className="panel panel-pad flex flex-wrap justify-center items-center gap-4">
          <label className="text-sm font-semibold">Select Date:</label>
          {availableDates.length > 0 ? (
            <select 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="field w-auto min-w-48 font-semibold"
            >
              {availableDates.map(d => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-gray-500 text-sm italic">No records found yet.</span>
          )}
        </div>

        {/* Content */}
        <div className="panel panel-pad mt-4 min-h-[50vh]">
          {loading ? (
            <p className="empty-state mt-8">Loading records...</p>
          ) : availableDates.length === 0 ? (
            <div className="empty-state mt-8">
              <p>The teacher hasn't logged any attendance or recitation yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {subjects.map(subject => {
                const subAtt = records.filter(r => r.subject_id === subject.id && r.status)
                const subRec = records.filter(r => r.subject_id === subject.id && r.times_called)
                const subNote = notes.find(n => n.subject_id === subject.id)

                const present = subAtt.filter(a => a.status === 'P').length
                const absent = subAtt.filter(a => a.status === 'A').length
                const late = subAtt.filter(a => a.status === 'L').length

                const recDetails = subRec.map(r => {
                  const student = students.find(s => s.id === r.student_id)
                  return { name: student?.name, count: r.times_called }
                }).sort((a, b) => b.count - a.count)

                if (subAtt.length === 0 && subRec.length === 0 && !subNote) return null

                return (
                  <div key={subject.id} className="panel panel-pad">
                    <h2 className="panel-title mb-4">{subject.name}</h2>
                    
                    {subAtt.length > 0 && (
                      <div className="mb-6">
                        <h3 className="field-label mb-2">Attendance</h3>
                        <div className="flex flex-wrap gap-3">
                          <div className="status-pill status-present">Present: {present}</div>
                          <div className="status-pill status-absent">Absent: {absent}</div>
                          <div className="status-pill status-late">Late: {late}</div>
                        </div>
                      </div>
                    )}

                    {recDetails.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Recitation Tally</h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {recDetails.map((r, i) => (
                            <li key={i} className="list-row">
                              <span>{r.name}</span>
                              <span className="font-bold">{r.count} times</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {subNote && subNote.notes && (
                      <div className="notice mt-4">
                        <strong>Notes:</strong> {subNote.notes}
                      </div>
                    )}
                  </div>
                )
              })}
              
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

// 2. The Default Export wrapped in Suspense
export default function GuestViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-gray-500">Loading...</div>}>
      <GuestViewContent />
    </Suspense>
  )
}