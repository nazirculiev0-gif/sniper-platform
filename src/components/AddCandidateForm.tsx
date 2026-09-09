"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SAMPLE_SKILLS = ["Node.js", "React", "SQL", "Английский B2", "Python", "Управление командой"];
const SAMPLE_PROFESSIONS = ["Backend Developer", "Frontend Developer", "Product Manager", "Data Analyst"];

function simulateParse(fileName: string) {
  const base = fileName.split(".")[0].replace(/[_-]/g, " ");
  const profession = SAMPLE_PROFESSIONS[Math.floor(Math.random() * SAMPLE_PROFESSIONS.length)];
  const skills = SAMPLE_SKILLS.sort(() => 0.5 - Math.random()).slice(0, 3);
  return {
    name: base.length > 2 ? base.replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Кандидат из резюме",
    profession,
    skills,
  };
}

export default function AddCandidateForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [cvStatus, setCvStatus] = useState<"idle" | "parsing" | "done">("idle");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!open) {
    return <button className="btn btn-soft btn-sm" onClick={() => setOpen(true)}>+ Добавить кандидата</button>;
  }

  const handleFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setCvStatus("parsing");
    setTimeout(() => {
      const parsed = simulateParse(file.name);
      setName(parsed.name);
      setProfession(parsed.profession);
      setSkills(parsed.skills);
      setCvStatus("done");
    }, 1200);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, profession, skills, source: fileName ? "Резюме (файл)" : "Вручную" }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setName(""); setProfession(""); setSkills([]); setCvStatus("idle"); setFileName("");
      router.refresh();
    } else {
      const data = await res.json();
      alert(JSON.stringify(data.error));
    }
  };

  return (
    <form onSubmit={submit} className="card card-p" style={{ marginBottom: 10 }}>
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div
        onClick={() => fileInput.current?.click()}
        style={{
          border: "1.5px dashed var(--line)",
          borderRadius: "var(--rs)",
          padding: 16,
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 14,
          background: cvStatus === "done" ? "var(--okbg)" : "var(--warm)",
        }}
      >
        {cvStatus === "idle" && (
          <>
            <b className="mini">Загрузить резюме</b>
            <div className="mini muted">PDF / Word — нажмите или перетащите файл. Поля заполнятся автоматически.</div>
          </>
        )}
        {cvStatus === "parsing" && (
          <>
            <b className="mini">Анализируем резюме…</b>
            <div className="mini muted">{fileName}</div>
          </>
        )}
        {cvStatus === "done" && (
          <>
            <b className="mini" style={{ color: "var(--ok)" }}>Распознано ✓ поля заполнены</b>
            <div className="mini muted">{fileName} — распознавание демонстрационное</div>
          </>
        )}
      </div>

      <div className="flex gap8" style={{ alignItems: "flex-end", marginBottom: 10 }}>
        <label className="fld" style={{ marginBottom: 0, flex: 1 }}>
          <span>Имя <em>*</em></span>
          <input className="inp" required value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label className="fld" style={{ marginBottom: 0, flex: 1 }}>
          <span>Профессия</span>
          <input className="inp" value={profession} onChange={e => setProfession(e.target.value)} />
        </label>
      </div>
      {skills.length > 0 && (
        <div className="flex gap8 wrapf" style={{ marginBottom: 10 }}>
          {skills.map((s) => <span key={s} className="tag">{s}</span>)}
        </div>
      )}
      <div className="flex gap8">
        <button className="btn btn-red btn-sm" disabled={loading} type="submit">Добавить</button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>Отмена</button>
      </div>
    </form>
  );
}
