'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AppHeader from '@/app/components/AppHeader'

export default function Recitation() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [tallies, setTallies] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // 1. Fetch Subjects & Set Today's Date
  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0])
    supabase.from('subjects').select('*').eq('archived', false).then(({ data }) => {
      if (data && data.length > 0) {
        setSubjects(data)
        setSelectedSubject(data[0].id)
      }
    })
  }, [])

  // 2. Fetch Students, Tallies, and Notes
  useEffect(() => {
    if (!selectedSubject || !date) return
    setLoading(true)
    
    const fetchData = async () => {
      // Get students
      const { data: stds } = await supabase.from('students').select('*').eq('archived', false).order('seat_row').order('seat_col')
      if (stds) setStudents(stds)

      // Get existing tallies
      const { data: recs } = await supabase.from('recitation').select('*').eq('subject_id', selectedSubject).eq('date', date)
      const newTallies: Record<string, number> = {}
      stds?.forEach(s => newTallies[s.id] = 0) // default to 0
      recs?.forEach(r => newTallies[r.student_id] = r.times_called)
      setTallies(newTallies)

      // Get notes
      const { data: notesData } = await supabase.from('daily_notes').select('*').eq('subject_id', selectedSubject).eq('date', date).maybeSingle()
      setNotes(notesData?.notes || '')
      
      setLoading(false)
    }
    fetchData()
  }, [selectedSubject, date])

  // 3. Handle Tapping
  const addTally = (studentId: string) => {
    setTallies(prev => ({ ...prev, [studentId]: (prev[studentId] || 0) + 1 }))
  }

  // Long press (right-click on PC) to subtract
  const subtractTally = (e: React.MouseEvent, studentId: string) => {
    e.preventDefault() // Prevent normal click
    if ((tallies[studentId] || 0) > 0) {
      setTallies(prev => ({ ...prev, [studentId]: prev[studentId] - 1 }))
    }
  }

  // 4. Save to Database
  const saveRecitation = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Save tallies
    const records = students
      .filter(s => tallies[s.id] > 0) // Only save students with more than 0
      .map(s => ({
        user_id: user?.id,
        date,
        subject_id: selectedSubject,
        student_id: s.id,
        times_called: tallies[s.id]
      }))

    // Delete existing records for this day to prevent duplicates when re-saving
    await supabase.from('recitation').delete().match({ user_id: user?.id, date, subject_id: selectedSubject })

    if (records.length > 0) {
      const { error } = await supabase.from('recitation').insert(records)
      if (error) alert("Error saving recitation: " + error.message)
    }

    // Save notes
    await supabase.from('daily_notes').upsert({ 
      user_id: user?.id, 
      date, 
      subject_id: selectedSubject, 
      notes 
    }, { onConflict: 'user_id,date,subject_id' })
    
    setSaving(false)
    alert("Recitation saved successfully!")
  }

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
          <button onClick={saveRecitation} disabled={saving || loading} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400">
            {saving ? 'Saving...' : 'Save Recitation'}
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">Tap a student to add +1. Right-click (or long-press on phone) to subtract.</p>

        {/* The Seating Chart */}
        {loading ? <p>Loading...</p> : (
          <div className="overflow-x-auto pb-4">
            <div 
              className="grid gap-2" 
              style={{ gridTemplateColumns: `repeat(${maxCol || 1}, minmax(100px, 1fr))` }}
            >
              {students.map(student => {
                const count = tallies[student.id] || 0
                const bgColor = count > 0 ? 'bg-blue-500' : 'bg-gray-200'
                const textColor = count > 0 ? 'text-white' : 'text-gray-500'
                return (
                  <div 
                    key={student.id}
                    onClick={() => addTally(student.id)}
                    onContextMenu={(e) => subtractTally(e, student.id)}
                    className={`${bgColor} ${textColor} p-2 rounded cursor-pointer text-xs font-bold text-center flex flex-col items-center justify-center min-h-[60px] shadow-sm select-none hover:opacity-80 transition relative`}
                    style={{ gridRow: student.seat_row, gridColumn: student.seat_col }}
                  >
                    <span>{student.name}</span>
                    {count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs border-2 border-white">
                        {count}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Class Notes */}
        <div className="mt-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Class Notes (Optional)</label>
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            placeholder="e.g., All students will receive a 10/10 for their recitation today."
            className="w-full p-3 border rounded text-black h-24 resize-none"
          />
        </div>

      </div>
    </div>
  )
}