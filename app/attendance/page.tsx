'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AppHeader from '@/app/components/AppHeader'

export default function Attendance() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
 const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)


   // 1. Fetch Subjects & Set Today's Date
  useEffect(() => {
    // Set date to today safely on the client side
    setDate(new Date().toISOString().split('T')[0])

    supabase.from('subjects').select('*').eq('archived', false).then(({ data }) => {
      if (data && data.length > 0) {
        setSubjects(data)
        setSelectedSubject(data[0].id)
      }
    })
  }, [])

  // 2. Fetch Students & Existing Attendance when Subject or Date changes
  useEffect(() => {
    if (!selectedSubject) return
    const fetchData = async () => {
      // Get students
      const { data: stds } = await supabase.from('students').select('*').eq('archived', false).order('seat_row').order('seat_col')
      if (!stds) return
      setStudents(stds)

      // Get existing attendance for this date/subject
      const { data: att } = await supabase.from('attendance').select('*').eq('subject_id', selectedSubject).eq('date', date)
      
      // Default everyone to 'P' (Present), unless they already have a saved status
      const newStatuses: Record<string, string> = {}
      stds.forEach(s => newStatuses[s.id] = 'P') 
      att?.forEach(a => newStatuses[a.student_id] = a.status)
      setStatuses(newStatuses)
    }
    fetchData()
  }, [selectedSubject, date])

  // 3. Toggle Status: Present -> Absent -> Late -> Present
  const toggleStatus = (studentId: string) => {
    setStatuses(prev => {
      const current = prev[studentId]
      const next = current === 'P' ? 'A' : current === 'A' ? 'L' : 'P' 
      return { ...prev, [studentId]: next }
    })
  }

  // 4. Save to Database
  const saveAttendance = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Prepare data for upsert (update if exists, insert if not)
    const records = students.map(s => ({
      user_id: user?.id,
      date,
      subject_id: selectedSubject,
      student_id: s.id,
      status: statuses[s.id]
    }))

    const { error } = await supabase.from('attendance').upsert(records, { 
      onConflict: 'user_id,date,subject_id,student_id' 
    })
    
    setSaving(false)
    if (error) alert("Error saving: " + error.message)
    else alert("Attendance saved successfully!")
  }

  // Calculate grid size based on the students' seat positions
  const maxRow = Math.max(...students.map(s => s.seat_row), 0)
  const maxCol = Math.max(...students.map(s => s.seat_col), 0)

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader />
      <div className="max-w-5xl mx-auto mt-8 px-4 pb-8">
        <Link href="/" className="text-blue-500 text-sm mb-4 block">← Back to Dashboard</Link>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="p-2 border rounded text-black font-semibold">
            {subjects.length === 0 && <option value="">No subjects found</option>}
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded text-black" />
          <button onClick={saveAttendance} disabled={saving || subjects.length === 0} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 disabled:bg-gray-400">
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>

        <div className="mb-4 text-sm flex gap-4">
          <span className="flex items-center gap-1"><div className="w-4 h-4 bg-green-500 rounded"></div> Present</span>
          <span className="flex items-center gap-1"><div className="w-4 h-4 bg-red-500 rounded"></div> Absent</span>
          <span className="flex items-center gap-1"><div className="w-4 h-4 bg-yellow-400 rounded"></div> Late</span>
        </div>

        {/* The Seating Chart */}
        <div className="overflow-x-auto pb-4">
          <div 
            className="grid gap-2" 
            style={{ gridTemplateColumns: `repeat(${maxCol || 1}, minmax(100px, 1fr))` }}
          >
            {students.map(student => {
              const status = statuses[student.id] || 'P'
              const bgColor = status === 'P' ? 'bg-green-500' : status === 'A' ? 'bg-red-500' : status === 'L' ? 'bg-yellow-400' : 'bg-gray-400'
              return (
                <div 
                  key={student.id}
                  onClick={() => toggleStatus(student.id)}
                  className={`${bgColor} text-white p-2 rounded cursor-pointer text-xs font-bold text-center flex items-center justify-center min-h-[60px] shadow-sm select-none hover:opacity-80 transition`}
                  style={{ gridRow: student.seat_row, gridColumn: student.seat_col }}
                >
                  {student.name}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}