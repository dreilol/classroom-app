"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSubjects = async () => {
    const { data, error } = await supabase.from("subjects").select("*").eq("archived", false);
    if (error) setMessage("Unable to load subjects. Please refresh and try again.");
    else setSubjects(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchSubjects(); }, []);

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjectName = newSubject.trim();
    if (!subjectName) return;
    setSaving(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("subjects").insert([{ name: subjectName, user_id: user?.id }]);
    if (error) setMessage("Could not add subject: " + error.message);
    else { setNewSubject(""); await fetchSubjects(); }
    setSaving(false);
  };
  const deleteSubject = async (id: string) => {
    if (!confirm("Archive this subject? Existing records will be kept.")) return;
    const { error } = await supabase.from("subjects").update({ archived: true }).eq("id", id);
    if (error) setMessage("Could not archive subject: " + error.message);
    else await fetchSubjects();
  };

  return <div className="min-h-screen"><AppHeader /><main className="page-container narrow">
    <Link href="/" className="page-back">← Back to dashboard</Link>
    <header className="page-heading"><div><p className="eyebrow">Classroom setup</p><h1 className="page-title">Subjects</h1><p className="page-description">Add and organize the subjects you teach.</p></div><span className="status-pill" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{subjects.length} active</span></header>
    <form onSubmit={addSubject} className="panel panel-pad mb-5 flex flex-col gap-3 sm:flex-row">
      <div className="min-w-0 flex-1"><label htmlFor="subject-name" className="field-label">New subject</label><input id="subject-name" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="e.g. General Mathematics" className="field" maxLength={80} required /></div>
      <button type="submit" disabled={saving || !newSubject.trim()} className="btn btn-primary self-end">{saving ? "Adding…" : "Add subject"}</button>
    </form>
    {message && <p role="status" className="notice mb-4">{message}</p>}
    <section className="panel panel-pad"><h2 className="panel-title mb-2">Your subjects</h2>
      {loading ? <p className="py-6 text-sm" style={{ color: "var(--muted)" }}>Loading subjects…</p> : subjects.length === 0 ? <div className="empty-state"><strong>No subjects yet</strong>Add your first subject above to get started.</div> : subjects.map(sub => <div key={sub.id} className="list-row"><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>▤</span><span className="truncate text-sm font-semibold">{sub.name}</span></div><button onClick={() => deleteSubject(sub.id)} className="btn btn-danger shrink-0">Archive</button></div>)}
    </section>
  </main></div>;
}