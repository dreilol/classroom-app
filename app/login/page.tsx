"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/");
  };

  return <main className="login-wrap">
    <form onSubmit={handleLogin} className="login-card">
      <Link href="/" className="app-brand mb-9"><span className="app-brand-mark">C</span><span>Classroom<span className="app-brand-muted">.space</span></span></Link>
      <p className="eyebrow">Your teaching workspace</p>
      <h1 className="page-title text-3xl">Welcome back</h1>
      <p className="page-description mb-7">Sign in to continue to your classroom.</p>
      {error && <div role="alert" className="mb-4 rounded-xl p-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>}
      <label className="field-label" htmlFor="email">Email address</label>
      <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="field mb-4" required />
      <label className="field-label" htmlFor="password">Password</label>
      <input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="field mb-6" required />
      <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? "Signing in…" : "Sign in"}</button>
      <p className="mt-6 text-center text-xs" style={{ color: "var(--muted)" }}>A simple space for your classroom, every day.</p>
    </form>
  </main>;
}