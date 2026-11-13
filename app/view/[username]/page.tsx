'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

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
  // NEW STATE FOR THE TOGGLE
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

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
    <div className="min-h-screen">
      <div className="page-container narrow">
        <div className="mx-auto max-w-4xl space-y-5">
          {/* Guest-only page heading */}
          <header className="hero-panel">
            <div className="relative z-10">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Classroom • Guest access</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Class Daily Digest</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">A clear overview of attendance, recitation, and class notes for the selected day.</p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-300"></span>
                Shared class overview
              </div>
            </div>
          </header>

          {/* Date selector */}
          <section className="panel panel-pad">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--foreground)]">Choose a date</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Switch between days with saved class records.</p>
              </div>
          {availableDates.length > 0 ? (
            <select
              aria-label="Select class record date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="field w-full sm:w-auto sm:min-w-64 font-semibold"
            >
              {availableDates.map(d => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm italic text-[var(--muted)]">No records found yet.</span>
          )}
            </div>
          </section>

          {/* Daily records */}
          <section className="panel panel-pad min-h-[50vh]">
          {loading ? (
            <div className="empty-state mt-8"><strong>Loading class records</strong><span className="text-sm">Please wait while the selected day is prepared.</span></div>
          ) : availableDates.length === 0 ? (
            <div className="empty-state mt-8">
              <><strong>No records for this day</strong><p>The teacher hasn't logged any attendance or recitation yet.</p></>
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
                  <article key={subject.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Subject</p>
                        <h2 className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">{subject.name}</h2>
                      </div>
                      <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-bold text-[var(--accent)]">Daily record</span>
                    </div>
                    
                    {subAtt.length > 0 && (
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="field-label">Attendance</h3>
                          {/* THE NEW TOGGLE BUTTON */}
                          <button 
                            onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
                            aria-expanded={expandedSubject === subject.id}
                            aria-controls={`attendance-details-${subject.id}`}
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:border-[var(--accent)]"
                          >
                            {expandedSubject === subject.id ? 'Hide student list' : 'View student list'}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-3">
                          <div className="status-pill status-present">Present: {present}</div>
                          <div className="status-pill status-absent">Absent: {absent}</div>
                          <div className="status-pill status-late">Late: {late}</div>
                        </div>

                        {/* THE NEW DETAILS DROPDOWN */}
                        {expandedSubject === subject.id && (
                          <div id={`attendance-details-${subject.id}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                            
                            {absent > 0 && (
                              <div className="mb-3">
                                <span className="mb-1 block font-bold text-[var(--danger)]">Absent:</span>
                                <ul className="grid grid-cols-1 gap-1 list-inside list-disc text-[var(--foreground)] sm:grid-cols-2">
                                  {subAtt.filter(a => a.status === 'A').map(a => {
                                    const student = students.find(s => s.id === a.student_id);
                                    return <li key={a.id}>{student?.name}</li>
                                  })}
                                </ul>
                              </div>
                            )}

                            {late > 0 && (
                              <div className="mb-3">
                                <span className="mb-1 block font-bold text-[var(--warning)]">Late:</span>
                                <ul className="list-disc list-inside text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {subAtt.filter(a => a.status === 'L').map(a => {
                                    const student = students.find(s => s.id === a.student_id);
                                    return <li key={a.id}>{student?.name}</li>
                                  })}
                                </ul>
                              </div>
                            )}

                            {present > 0 && (
                              <div>
                                <span className="mb-1 block font-bold text-[var(--success)]">Present:</span>
                                <ul className="list-disc list-inside text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {subAtt.filter(a => a.status === 'P').map(a => {
                                    const student = students.find(s => s.id === a.student_id);
                                    return <li key={a.id}>{student?.name}</li>
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
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
                  </article>
                )
              })}
              
            </div>
          )}
          </section>
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