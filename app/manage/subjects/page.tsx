'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AppHeader from '@/app/components/AppHeader'

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [newSubject, setNewSubject] = useState('')

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').eq('archived', false)
    if (data) setSubjects(data)
  }

  useEffect(() => { fetchSubjects() }, [])

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('subjects').insert([{ name: newSubject, user_id: user?.id }])
    setNewSubject('')
    fetchSubjects()
  }

  const deleteSubject = async (id: string) => {
    // We don't actually delete it from the database, we just archive it to keep records safe
    await supabase.from('subjects').update({ archived: true }).eq('id', id)
    fetchSubjects()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader />
      <div className="max-w-3xl mx-auto mt-8 px-4 pb-8">
        <Link href="/" className="text-blue-500 text-sm mb-4 block">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Subjects</h1>
        
        <form onSubmit={addSubject} className="flex gap-2 mb-6">
          <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="e.g. General Math" className="flex-1 p-2 border rounded text-black" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
        </form>

        <ul className="space-y-2">
          {subjects.map(sub => (
            <li key={sub.id} className="flex justify-between items-center p-3 border rounded bg-gray-50">
              <span className="font-medium text-gray-800">{sub.name}</span>
              <button onClick={() => deleteSubject(sub.id)} className="text-red-500 text-sm">Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}