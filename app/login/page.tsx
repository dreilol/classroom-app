'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-7 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">C</div><h1 className="text-2xl font-bold tracking-tight text-gray-800">Welcome back</h1><p className="mt-1 text-sm text-gray-500">Sign in to your classroom workspace</p></div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="mb-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded mb-4 text-black" required />
        <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">Login</button>
      </form>
    </div>
  )
}