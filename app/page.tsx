'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [router])

  if (!user) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Classroom Dashboard</h1>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-red-500 font-semibold">Logout</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/manage/students" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border-l-4 border-blue-500">
            <h2 className="text-xl font-semibold text-gray-800">Manage Students</h2>
            <p className="text-gray-500 text-sm mt-1">Add names and seating positions</p>
          </Link>
          
          <Link href="/manage/subjects" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border-l-4 border-purple-500">
            <h2 className="text-xl font-semibold text-gray-800">Manage Subjects</h2>
            <p className="text-gray-500 text-sm mt-1">Create your class list</p>
          </Link>

          <Link href="/attendance" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border-l-4 border-green-500 col-span-1 md:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800">📋 Take Attendance</h2>
            <p className="text-gray-500 text-sm mt-1">Open seating chart to mark Present/Absent</p>
          </Link>
                    <Link href="/recitation" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border-l-4 border-orange-500 col-span-1 md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-gray-800">🗣️ Log Recitation</h2>
            <p className="text-gray-500 text-sm mt-1">Tap students to add tallies for participation</p>
          </Link>
                    {/* Share Link */}
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-gray-400 col-span-1 md:col-span-2 mt-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">🔗 Share Guest View</h2>
              <p className="text-gray-500 text-sm mt-1">Send this link to other teachers</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + '/view/class')
                alert('Link copied to clipboard!')
              }}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}