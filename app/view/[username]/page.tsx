'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'

// Public, read-only daily digest for guests.
function GuestViewContent() {
  const [date, setDate] = useState('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    if (!date) return
    setLoading(true)

    const fetchGuestData = async () => {
      const { data: subs } = await supabase.from('subjects').select('*').eq('archived', false)
      const { data: stds } = await supabase.from('students').select('*').eq('archived', false)
      if (subs) setSubjects(subs)
      if (stds) setStudents(stds)

      const { data: att } = await supabase.from('attendance').select('*').eq('date', date)
      const { data: rec } = await supabase.from('recitation').select('*').eq('date', date)
      setRecords([...(att || []), ...(rec || [])])

      const { data: nts } = await supabase.from('daily_notes').select('*').eq('date', date)
      if (nts) setNotes(nts)
      setLoading(false)
    }

    fetchGuestData()
  }, [date])

  const attendanceRecords = records.filter(record => record.status)
  const recitationRecords = records.filter(record => record.times_called)
  const presentCount = attendanceRecords.filter(record => record.status === 'P').length
  const absentCount = attendanceRecords.filter(record => record.status === 'A').length
  const lateCount = attendanceRecords.filter(record => record.status === 'L').length
  const totalRecitations = recitationRecords.reduce((sum, record) => sum + Number(record.times_called || 0), 0)
  const loggedSubjects = subjects.filter(subject =>
    records.some(record => record.subject_id === subject.id) ||
    notes.some(note => note.subject_id === subject.id && note.notes)
  )

  return (
    <main className="min-h-screen">
      <div className="page-container narrow">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-sm font-extrabold text-white shadow-sm">C</span>
            <div>
              <p className="text-sm font-extrabold tracking-tight">Classroom<span className="font-semibold text-[var(--muted)]">.space</span></p>
              <p className="text-xs text-[var(--muted)]">Class updates for guests</p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]">Guest view · Read only</span>
        </header>

        <section className="hero-panel mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-blue-100">Daily classroom update</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Class Daily Digest</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">A clear overview of the class attendance and recitation records for the selected day.</p>
        </section>

        <section className="panel panel-pad mb-4">
          <label htmlFor="guest-date" className="field-label">Choose a date</label>
          {availableDates.length > 0 ? (
            <select
              id="guest-date"
              value={date}
              onChange={event => setDate(event.target.value)}
              className="field"
            >
              {availableDates.map(day => (
                <option key={day} value={day}>
                  {new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-[var(--muted)]">No dates are available yet.</p>
          )}
        </section>

        {loading ? (
          <section className="panel empty-state">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            <strong>Loading class records</strong>
            <span className="text-sm">Please wait while the daily digest is prepared.</span>
          </section>
        ) : availableDates.length === 0 ? (
          <section className="panel empty-state">
            <strong>No classroom updates yet</strong>
            <span className="text-sm">Attendance and recitation records will appear here once they are logged.</span>
          </section>
        ) : (
          <>
            <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="stat-card">
                <p className="stat-label">Present</p>
                <p className="stat-value">{presentCount}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Absent</p>
                <p className="stat-value">{absentCount}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Late</p>
                <p className="stat-value">{lateCount}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Recitations</p>
                <p className="stat-value">{totalRecitations}</p>
              </div>
            </section>

            <section className="space-y-4">
              {loggedSubjects.length === 0 ? (
                <div className="panel empty-state">
                  <strong>No records for this date</strong>
                  <span className="text-sm">There are no attendance, recitation, or notes to display for the selected day.</span>
                </div>
              ) : loggedSubjects.map(subject => {
                const subAtt = records.filter(record => record.subject_id === subject.id && record.status)
                const subRec = records.filter(record => record.subject_id === subject.id && record.times_called)
                const subNote = notes.find(note => note.subject_id === subject.id && note.notes)
                const present = subAtt.filter(record => record.status === 'P').length
                const absent = subAtt.filter(record => record.status === 'A').length
                const late = subAtt.filter(record => record.status === 'L').length
                const recDetails = subRec.map(record => {
                  const student = students.find(item => item.id === record.student_id)
                  return { id: record.student_id, name: student?.name || 'Unknown student', count: Number(record.times_called || 0) }
                }).sort((a, b) => b.count - a.count)

                return (
                  <article key={subject.id} className="panel panel-pad">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="eyebrow mb-1">Subject</p>
                        <h2 className="panel-title text-lg">{subject.name}</h2>
                      </div>
                      <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">Daily record</span>
                    </div>

                    {subAtt.length > 0 && (
                      <div className="mb-5">
                        <h3 className="field-label mb-3">Attendance summary</h3>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-[var(--success-soft)] p-3">
                            <p className="text-xs font-semibold text-[var(--success)]">Present</p>
                            <p className="mt-1 text-xl font-extrabold text-[var(--success)]">{present}</p>
                          </div>
                          <div className="rounded-xl bg-[var(--danger-soft)] p-3">
                            <p className="text-xs font-semibold text-[var(--danger)]">Absent</p>
                            <p className="mt-1 text-xl font-extrabold text-[var(--danger)]">{absent}</p>
                          </div>
                          <div className="rounded-xl bg-[var(--warning-soft)] p-3">
                            <p className="text-xs font-semibold text-[var(--warning)]">Late</p>
                            <p className="mt-1 text-xl font-extrabold text-[var(--warning)]">{late}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {recDetails.length > 0 && (
                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="field-label mb-0">Recitation tally</h3>
                          <span className="text-xs font-semibold text-[var(--muted)]">{recDetails.length} student{recDetails.length === 1 ? '' : 's'}</span>
                        </div>
                        <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                          {recDetails.map((student, index) => (
                            <li key={student.id || index} className="list-row text-sm">
                              <span className="min-w-0 truncate font-medium text-[var(--foreground)]">{student.name}</span>
                              <span className="shrink-0 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-bold text-[var(--foreground)]">{student.count} {student.count === 1 ? 'time' : 'times'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {subNote?.notes && (
                      <div className="notice mt-4">
                        <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-[var(--muted)]">Class note</p>
                        <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">{subNote.notes}</p>
                      </div>
                    )}
                  </article>
                )
              })}
            </section>
          </>
        )}

        <footer className="pt-6 text-center text-xs text-[var(--muted)]">
          Classroom.space · Shared class information
        </footer>
      </div>
    </main>
  )
}

export default function GuestViewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--muted)]">Loading guest view…</div>}>
      <GuestViewContent />
    </Suspense>
  )
}