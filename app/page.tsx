"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";

const actions = [
  { href: "/attendance", number: "01", title: "Take attendance", detail: "Mark students present, absent, or late.", icon: "✓", tint: "#e8f7ef", ink: "#16845b" },
  { href: "/recitation", number: "02", title: "Log recitation", detail: "Track participation and add class notes.", icon: "✎", tint: "#edf1ff", ink: "#4568e8" },
  { href: "/manage/students", number: "03", title: "Seating chart", detail: "Organize your students and classroom layout.", icon: "▦", tint: "#f1edff", ink: "#7557c8" },
  { href: "/manage/subjects", number: "04", title: "Manage subjects", detail: "Keep your teaching subjects organized.", icon: "▤", tint: "#fff5e6", ink: "#a66a12" },
];

export default function Dashboard() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyState, setCopyState] = useState("Copy guest link");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) router.replace("/login");
      else setUser(data.user);
      setLoading(false);
    });
    return () => { active = false; };
  }, [router]);

  const copyGuestLink = async () => {
    const url = window.location.origin + "/view/class";
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("Link copied!");
    } catch {
      setCopyState(url);
    }
  };
  const logout = async () => { await supabase.auth.signOut(); router.replace("/login"); };

  if (loading || !user) return <div className="min-h-screen"><AppHeader /><main className="page-container"><div className="panel panel-pad text-sm" style={{ color: "var(--muted)" }}>Loading your classroom…</div></main></div>;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="page-container">
        <section className="page-heading">
          <div><p className="eyebrow">Your workspace</p><h1 className="page-title">Classroom dashboard</h1><p className="page-description">Everything you need to keep your class organized.</p></div>
          <button onClick={logout} className="btn btn-secondary">Sign out</button>
        </section>
        <section className="hero-panel mb-8">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-200">Classroom, made simpler</p>
          <h2 className="relative z-10 mt-3 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">A clear view of your day starts here.</h2>
          <p className="relative z-10 mt-2 max-w-xl text-sm leading-6 text-slate-200">Choose a tool below to record attendance, track participation, or manage your classroom setup.</p>
        </section>
        <section>
          <div className="mb-4 flex items-center justify-between"><h2 className="panel-title">Classroom tools</h2><span className="text-xs" style={{ color: "var(--muted)" }}>4 tools available</span></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {actions.map((action) => <Link key={action.href} href={action.href} className="tool-card">
              <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl text-lg font-bold" style={{ background: action.tint, color: action.ink }}>{action.icon}</span><span className="text-xs font-bold tracking-widest" style={{ color: "var(--muted)" }}>{action.number}</span></div>
              <div><h3 className="text-base font-bold">{action.title}</h3><p className="mt-1 text-sm leading-5" style={{ color: "var(--muted)" }}>{action.detail}</p><p className="mt-4 text-sm font-bold" style={{ color: "var(--accent)" }}>Open tool <span aria-hidden="true">→</span></p></div>
            </Link>)}
          </div>
        </section>
        <section className="panel mt-7 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div><h2 className="panel-title">Share a read-only class view</h2><p className="panel-subtitle">Let another teacher view your daily attendance and recitation records.</p></div>
          <button onClick={copyGuestLink} className="btn btn-primary shrink-0">{copyState}</button>
        </section>
      </main>
    </div>
  );
}