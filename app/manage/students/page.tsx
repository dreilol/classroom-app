"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";

export default function ManageStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [selectedSeat, setSelectedSeat] = useState<{r:number;c:number}|null>(null);
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(4);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchStudents = async () => {
    const { data, error } = await supabase.from("students").select("*").eq("archived", false).order("seat_row").order("seat_col");
    if (error) setMessage("Unable to load students. Please refresh and try again.");
    else setStudents(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchStudents(); }, []);

  const addStudentToSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentName = name.trim();
    if (!studentName || !selectedSeat) return;
    setSaving(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("students").insert([{ name: studentName, seat_row: selectedSeat.r, seat_col: selectedSeat.c, user_id: user?.id }]);
    if (error) setMessage("Could not add student: " + error.message);
    else { setName(""); setSelectedSeat(null); await fetchStudents(); }
    setSaving(false);
  };
  const deleteStudent = async (id: string) => {
    if (!confirm("Archive this student? Their previous records will be kept.")) return;
    const { error } = await supabase.from("students").update({ archived: true }).eq("id", id);
    if (error) setMessage("Could not archive student: " + error.message);
    else await fetchStudents();
  };

  const grid = Array.from({length: rows * cols}, (_, i) => ({r: Math.floor(i / cols) + 1, c: (i % cols) + 1}));
  return <div className="min-h-screen"><AppHeader /><main className="page-container">
    <Link href="/" className="page-back">← Back to dashboard</Link>
    <header className="page-heading"><div><p className="eyebrow">Classroom setup</p><h1 className="page-title">Seating chart</h1><p className="page-description">Choose a seat to add a student. Select an occupied seat to archive that student.</p></div><span className="status-pill" style={{background:"var(--accent-soft)",color:"var(--accent)"}}>{students.length} students</span></header>
    <section className="panel panel-pad mb-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><h2 className="panel-title">Room layout</h2><p className="panel-subtitle">Adjust the grid to match your classroom.</p></div><div className="flex gap-3"><label className="text-xs font-semibold" style={{color:"var(--muted)"}}>Rows<input aria-label="Rows" type="number" min="1" max="10" value={rows} onChange={e=>setRows(Math.min(10,Math.max(1,Number(e.target.value)||1)))} className="field mt-1 w-20" /></label><label className="text-xs font-semibold" style={{color:"var(--muted)"}}>Columns<input aria-label="Columns" type="number" min="1" max="10" value={cols} onChange={e=>setCols(Math.min(10,Math.max(1,Number(e.target.value)||1)))} className="field mt-1 w-20" /></label></div></div>
      <div className="overflow-x-auto pb-2"><div className="seat-grid" style={{gridTemplateColumns:`repeat(${cols}, minmax(94px, 1fr))`}}>
        {grid.map(({r,c})=>{const student=students.find(s=>s.seat_row===r&&s.seat_col===c);const selected=selectedSeat?.r===r&&selectedSeat?.c===c;return <button type="button" key={`${r}-${c}`} onClick={()=>{if(student)deleteStudent(student.id);else{setSelectedSeat({r,c});setName("");}}} className={`seat ${student?"":"seat-empty"} ${selected?"seat-selected":""}`} aria-label={student?`${student.name}, select to archive`:`Empty seat row ${r}, column ${c}`}><span>{student?.name||"Empty seat"}</span><span className="text-[10px] font-medium opacity-70">R{r} · C{c}</span></button>;})}
      </div></div>
    </section>
    {message&&<p role="status" className="notice mb-4">{message}</p>}
    {selectedSeat&&<form onSubmit={addStudentToSeat} className="panel panel-pad"><div className="mb-4"><h2 className="panel-title">Add student to seat</h2><p className="panel-subtitle">Row {selectedSeat.r}, column {selectedSeat.c}</p></div><div className="flex flex-col gap-3 sm:flex-row"><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Enter student's full name" className="field flex-1" required maxLength={100}/><button disabled={saving||!name.trim()} type="submit" className="btn btn-primary">{saving?"Saving…":"Save student"}</button><button type="button" onClick={()=>setSelectedSeat(null)} className="btn btn-secondary">Cancel</button></div></form>}
    {loading&&<p className="mt-4 text-sm" style={{color:"var(--muted)"}}>Loading classroom…</p>}
  </main></div>;
}