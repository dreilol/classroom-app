'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/app/components/AppHeader'

const actions = [
  { href: '/attendance', number: '01', title: 'Take attendance', detail: 'Mark students present, absent, or late.', icon: '✓', tone: 'green' },
  { href: '/recitation', number: '02', title: 'Log recitation', detail: 'Track participation and add class notes.', icon: '✎', tone: 'blue' },
  { href: '/manage/students', number: '03', title: 'Classroom layout', detail: 'Organize students by their seating positions.', icon: '▦', tone: 'violet' },
  { href: '/manage/subjects', number: '04', title: 'Manage subjects', detail: 'Keep your teaching subjects organized.', icon: '▤', tone: 'amber' },
]

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copyState, setCopyState] = useState('Copy guest link')
  const router = useRouter()

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      if (!data.user) router.replace('/login')
      else setUser(data.user)
      setLoading(false)
    })
    return () => { active = false }
  }, [router])

  const copyGuestLink = async () => {
    const url = window.location.origin + '/view/class'
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('Link copied!')
    } catch {
      setCopyState(url)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading || !user) return <div className="min-h-screen bg-gray-100"><AppHeader /><div className="mx-auto max-w-5xl px-4 py-16 text-sm text-gray-500">Loading your classroom…</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-blue-600">Your workspace</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">Classroom dashboard</h1>
            <p className="mt-2 text-sm text-gray-500">Everything you need to keep your class organized.</p>
          </div>
          <button onClick={logout} className="self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:text-red-600 sm:self-auto">Sign out</button>
        </section>

        <section className="mb-8 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-blue-200">Classroom, made simpler</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">A clear view of your day starts here.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Choose a tool below to record attendance, track participation, or manage your classroom setup.</p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Classroom tools</h2>
            <span className="text-xs font-medium text-gray-500">4 tools available</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {actions.map((action) => (
              <Link key={action.href} href={action.href} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl text-lg font-bold ${action.tone === 'green' ? 'bg-green-50 text-green-700' : action.tone === 'blue' ? 'bg-blue-50 text-blue-700' : action.tone === 'violet' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'}`}>{action.icon}</span>
                  <span className="text-xs font-bold tracking-widest text-gray-400">{action.number}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-700">{action.title}</h3>
                <p className="mt-1 text-sm leading-5 text-gray-500">{action.detail}</p>
                <p className="mt-5 text-sm font-semibold text-blue-600">Open tool <span aria-hidden="true">→</span></p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-bold text-gray-800">Share a read-only class view</p>
            <p className="mt-1 text-sm text-gray-500">Let another teacher view your daily attendance and recitation records.</p>
          </div>
          <button onClick={copyGuestLink} className="shrink-0 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700">{copyState}</button>
        </section>
      </main>
    </div>
  )
}