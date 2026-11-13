"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";

export default function Attendance() {
  const [subjects,setSubjects]=useState<any[]>([]);
  const [selectedSubject,setSelectedSubject]=useState("");
  const [students,setStudents]=useState<any[]>([]);
  const [statuses,setStatuses]=useState<Record<string,string>>({});
  const [date,setDate]=useState("");
  const [saving,setSaving]=useState(false);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");

  useEffect(()=>{setDate(new Date().toLocaleDateString("en-CA"));supabase.from("subjects").select("*").eq("archived",false).then(({data,error})=>{if(error)setMessage("Unable to load subjects.");if(data?.length){setSubjects(data);setSelectedSubject(data[0].id);}else setLoading(false);});},[]);
  useEffect(()=>{
    if(!selectedSubject||!date)return;
    let active=true;setLoading(true);
    const load=async()=>{
      const [{data:stds,error:studentsError},{data:att,error:attendanceError}]=await Promise.all([
        supabase.from("students").select("*").eq("archived",false).order("seat_row").order("seat_col"),
        supabase.from("attendance").select("*").eq("subject_id",selectedSubject).eq("date",date)
      ]);
      if(!active)return;
      if(studentsError||attendanceError)setMessage("Some attendance data could not be loaded. Please try again.");
      const roster=stds||[];setStudents(roster);
      const next:Record<string,string>={};roster.forEach(s=>next[s.id]="P");att?.forEach(a=>next[a.student_id]=a.status);setStatuses(next);setLoading(false);
    };load();return()=>{active=false;};
  },[selectedSubject,date]);
  const toggleStatus=(id:string)=>setStatuses(prev=>({...prev,[id]:prev[id]==="P"?"A":prev[id]==="A"?"L":"P"}));
  const saveAttendance=async()=>{
    if(!selectedSubject||!date||students.length===0)return;
    setSaving(true);setMessage("");
    const {data:{user}}=await supabase.auth.getUser();
    const records=students.map(s=>({user_id:user?.id,date,subject_id:selectedSubject,student_id:s.id,status:statuses[s.id]||"P"}));
    const {error}=await supabase.from("attendance").upsert(records,{onConflict:"user_id,date,subject_id,student_id"});
    setSaving(false);setMessage(error?"Could not save attendance: "+error.message:"Attendance saved successfully.");
  };
  const counts={P:Object.values(statuses).filter(v=>v==="P").length,A:Object.values(statuses).filter(v=>v==="A").length,L:Object.values(statuses).filter(v=>v==="L").length};
  const maxCol=Math.max(...students.map(s=>s.seat_col||1),1);
  return <div className="min-h-screen"><AppHeader/><main className="page-container">
    <Link href="/" className="page-back">← Back to dashboard</Link>
    <header className="page-heading"><div><p className="eyebrow">Daily classroom workflow</p><h1 className="page-title">Attendance</h1><p className="page-description">Tap a student's seat to cycle through present, absent, and late.</p></div><button onClick={saveAttendance} disabled={saving||loading||!students.length} className="btn btn-primary">{saving?"Saving…":"Save attendance"}</button></header>
    <section className="panel panel-pad mb-5"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label><span className="field-label">Subject</span><select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)} className="field">{subjects.length===0&&<option value="">No subjects found</option>}{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label><span className="field-label">Date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="field"/></label></div></section>
    <div className="mb-4 grid grid-cols-3 gap-3"><div className="stat-card"><p className="stat-label">Present</p><p className="stat-value" style={{color:"var(--success)"}}>{counts.P}</p></div><div className="stat-card"><p className="stat-label">Absent</p><p className="stat-value" style={{color:"var(--danger)"}}>{counts.A}</p></div><div className="stat-card"><p className="stat-label">Late</p><p className="stat-value" style={{color:"var(--warning)"}}>{counts.L}</p></div></div>
    {message&&<p role="status" className="notice mb-4">{message}</p>}
    <section className="panel panel-pad"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="panel-title">Class seating chart</h2><p className="panel-subtitle">Tap a student to change their status.</p></div><span className="text-xs" style={{color:"var(--muted)"}}>{students.length} students</span></div>
      {loading?<div className="empty-state">Loading attendance…</div>:students.length===0?<div className="empty-state"><strong>No students found</strong>Add students in your seating chart before taking attendance.</div>:<div className="overflow-x-auto pb-2"><div className="seat-grid" style={{gridTemplateColumns:`repeat(${maxCol}, minmax(94px, 1fr))`}}>{students.map(s=>{const status=statuses[s.id]||"P";const cls=status==="P"?"seat-present":status==="A"?"seat-absent":"seat-late";const label=status==="P"?"Present":status==="A"?"Absent":"Late";return <button type="button" key={s.id} onClick={()=>toggleStatus(s.id)} className={`seat ${cls}`} style={{gridRow:s.seat_row||1,gridColumn:s.seat_col||1}} aria-label={`${s.name}: ${label}. Tap to change.`}><span>{s.name}</span><span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></button>;})}</div></div>}
    </section>
  </main></div>;
}