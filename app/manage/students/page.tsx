'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ManageStudents() {
  const [students, setStudents] = useState<any[]>([])
  const [name, setName] = useState('')
  
  // State for the grid
  const [selectedSeat, setSelectedSeat] = useState<{r: number, c: number} | null>(null)
  const [rows, setRows] = useState(5)
  const [cols, setCols] = useState(4)

  const fetchStudents = async () => {
    const { data, error } = await supabase.from('students').select('*').eq('archived', false)
    if (error) {
      console.error("Error fetching students:", error)
    } else if (data) {
      setStudents(data)
    }
  }

  useEffect(() => { fetchStudents() }, [])

  const addStudentToSeat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !selectedSeat) return
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('students').insert([{ 
      name, 
      seat_row: selectedSeat.r, 
      seat_col: selectedSeat.c, 
      user_id: user?.id 
    }])
    
    if (error) {
      alert("Error adding student: " + error.message)
    } else { 
      setName('')
      setSelectedSeat(null) // Reset selection
      fetchStudents() 
    }
  }

  const deleteStudent = async (id: string) => {
    if(!confirm("Remove this student?")) return;
    await supabase.from('students').update({ archived: true }).eq('id', id)
    fetchStudents()
  }

  // Generate the grid array based on rows and cols
  const grid = []
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      grid.push({ r, c })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
        <Link href="/" className="text-blue-500 text-sm mb-4 block">← Back to Dashboard</Link>
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Classroom Layout</h1>
          <div className="flex gap-2 text-sm">
            <label>Rows: <input type="number" min="1" max="10" value={rows} onChange={e => setRows(Number(e.target.value))} className="w-16 p-1 border rounded text-black" /></label>
            <label>Cols: <input type="number" min="1" max="10" value={cols} onChange={e => setCols(Number(e.target.value))} className="w-16 p-1 border rounded text-black" /></label>
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-4">Tap an empty seat to add a student. Tap a filled seat to remove them.</p>

        {/* The Grid */}
        <div 
          className="grid gap-2 mb-8" 
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {grid.map(({ r, c }) => {
            const student = students.find(s => s.seat_row === r && s.seat_col === c)
            const isSelected = selectedSeat?.r === r && selectedSeat?.c === c

            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => {
                  if (student) {
                    deleteStudent(student.id)
                  } else {
                    setSelectedSeat({ r, c })
                    setName('')
                  }
                }}
                className={`p-2 h-20 rounded cursor-pointer border-2 flex flex-col items-center justify-center text-center transition-all
                  ${student ? 'bg-blue-100 border-blue-400 hover:bg-red-100 hover:border-red-400' 
                            : isSelected ? 'bg-yellow-100 border-yellow-500 shadow-inner' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              >
                {student ? (
                  <span className="text-xs font-bold text-blue-900 line-clamp-2">{student.name}</span>
                ) : (
                  <span className="text-xs text-gray-400">Empty<br/>R{r} C{c}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Input Form for Selected Seat */}
        {selectedSeat && (
          <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">Adding student to Row {selectedSeat.r}, Col {selectedSeat.c}</h3>
            <form onSubmit={addStudentToSeat} className="flex gap-2">
              <input 
                autoFocus
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Enter student name..." 
                className="flex-1 p-2 border rounded text-black" 
                required 
              />
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700">Save</button>
              <button type="button" onClick={() => setSelectedSeat(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}