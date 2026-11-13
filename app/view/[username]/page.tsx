'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

export default function GuestView() {
  const params = useParams()
  
  const [date, setDate] = useState('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Fetch available dates, then set the latest one as default
  useEffect(() => {
    const fetchDates = async () => {
      // Get dates from attendance
      const { data: attDates } = await supabase.from('attendance').select('date')
      // Get dates from recitation
      const { data: recDates } = await supabase.from('recitation').select('date')
      
      // Combine them and remove duplicates
      const allDates = [
        ...(attDates?.map(a => a.date) || []),
        ...(recDates?.map(r => r.date) || [])
      ]
      const uniqueDates = Array.from(new Set(allDates)).sort((a, b) => b.localeCompare(a)) // Sort newest first
      
      setAvailableDates(uniqueDates)
      if (uniqueDates.length > 0) setDate(uniqueDates[0]) // Default to the most recent date
      else setLoading(false)
    }
    fetchDates()
  }, [])

  // 2. Fetch all data when date changes
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 rounded-t-xl text-center">
          <h1 className="text-2xl font-bold">Class Daily Digest</h1>
          <p className="text-slate-300 mt-1">Attendance & Recitation Records</p>
        </div>

        {/* Date Dropdown */}
        <div className="bg-white p-4 shadow-sm border-b flex justify-center items-center gap-4">
          <label className="font-semibold text-gray-700">Select Date:</label>
          {availableDates.length > 0 ? (
            <select 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="p-2 border rounded text-black font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-slate-100 p-4 md:p-6 rounded-b-xl border border-t-0 shadow-sm min-h-[50vh]">
          {loading ? (
            <p className="text-center text-gray-500 mt-10">Loading records...</p>
          ) : availableDates.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
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

                // If no data exists for this subject on this specific date, hide the card entirely
                if (subAtt.length === 0 && subRec.length === 0 && !subNote) return null

                return (
                  <div key={subject.id} className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{subject.name}</h2>
                    
                    {subAtt.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Attendance</h3>
                        <div className="flex gap-4">
                          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold border border-green-200">Present: {present}</div>
                          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg font-semibold border border-red-200">Absent: {absent}</div>
                          <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-semibold border border-yellow-200">Late: {late}</div>
                        </div>
                      </div>
                    )}

                    {recDetails.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Recitation Tally</h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                          {recDetails.map((r, i) => (
                            <li key={i} className="flex justify-between border-b pb-1">
                              <span>{r.name}</span>
                              <span className="font-bold">{r.count} times</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {subNote && subNote.notes && (
                      <div className="bg-blue-50 p-3 rounded text-sm text-blue-900 italic border border-blue-100 mt-4">
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
  )
}