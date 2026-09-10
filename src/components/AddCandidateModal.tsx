"use client";

import { useEffect, useRef, useState } from "react";
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

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

export default function AddCandidateModal({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<"base" | "new">("base");
  const [base, setBase] = useState<any[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);

  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [expSalary, setExpSalary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [stage, setStage] = useState("NEW");
  const [cvStatus, setCvStatus] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileData, setFileData] = useState("");
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 МБ

  useEffect(() => {
    fetch("/api/candidates/base")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setBase(data); setLoadingBase(false); });
  }, []);

  const addFromBase = async (candidateId: string) => {
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/candidates/from-base`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      const data = await res.json();
      alert(data.error || "Не удалось добавить кандидата");
    }
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    setFileError("");
    if (file.size > MAX_FILE_BYTES) {
      setFileError("Файл слишком большой — максимум 4 МБ");
      setCvStatus("error");
      return;
    }
    setFileName(file.name);
    setFileType(file.type);
    setCvStatus("parsing");

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      // "Распознавание" полей — демо-симуляция; сам файл при этом сохраняется по-настоящему.
      setTimeout(() => {
        const parsed = simulateParse(file.name);
        setName(parsed.name);
        setProfession(parsed.profession);
        setSkills(parsed.skills);
        setFileData(base64);
        setCvStatus("done");
      }, 1200);
    };
    reader.onerror = () => {
      setFileError("Не удалось прочитать файл");
      setCvStatus("error");
    };
    reader.readAsDataURL(file);
  };

  const createAndAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        profession,
        skills,
        expSalary: expSalary ? Number(expSalary.replace(/\D/g, "")) : undefined,
        source: fileName ? "Резюме (файл)" : "Вручную",
        stage,
        resumeFileName: fileName || undefined,
        resumeFileType: fileType || undefined,
        resumeFileData: fileData || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      const data = await res.json();
      alert(JSON.stringify(data.error));
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(20,24,30,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={onClose}
    >
      <div className="card" style={{ width: "min(640px, 100%)", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <h3 style={{ fontSize: 15 }}>Добавить кандидата в заявку</h3>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={onClose}>×</button>
        </div>

        <div className="flex gap8" style={{ padding: "12px 18px 0", borderBottom: "1px solid var(--line)" }}>
          <button
            onClick={() => setTab("base")}
            style={{ background: "none", border: "none", borderBottom: tab === "base" ? "2px solid var(--red)" : "2px solid transparent", color: tab === "base" ? "var(--red)" : "var(--mid)", fontWeight: 600, fontSize: 13, padding: "8px 4px", marginRight: 16, cursor: "pointer" }}
          >
            Из моей базы
          </button>
          <button
            onClick={() => setTab("new")}
            style={{ background: "none", border: "none", borderBottom: tab === "new" ? "2px solid var(--red)" : "2px solid transparent", color: tab === "new" ? "var(--red)" : "var(--mid)", fontWeight: 600, fontSize: 13, padding: "8px 4px", marginRight: 16, cursor: "pointer" }}
          >
            + Новый кандидат
          </button>
        </div>

        <div style={{ padding: 18 }}>
          {tab === "base" && (
            <div>
              {loadingBase && <div className="mini muted">Загрузка…</div>}
              {!loadingBase && base.length === 0 && (
                <div className="mini muted">В базе нет свободных кандидатов — все уже привязаны к заявкам, либо база пуста.</div>
              )}
              <div style={{ display: "grid", gap: 8 }}>
                {base.map((c) => (
                  <div key={c.id} className="card card-p flex gap8" style={{ alignItems: "center" }}>
                    <div className="av" style={{ width: 32, height: 32, fontSize: 12 }}>
                      {c.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <b className="mini" style={{ display: "block" }}>{c.name}</b>
                      <span className="mini muted">{c.profession || "—"} {c.expSalary ? `· ${fmtSum(c.expSalary)}` : ""}</span>
                    </div>
                    <button className="btn btn-red btn-sm" disabled={loading} onClick={() => addFromBase(c.id)}>+ Добавить</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "new" && (
            <div>
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
                  border: "1.5px dashed var(--line)", borderRadius: "var(--rs)", padding: 16, textAlign: "center",
                  cursor: "pointer", marginBottom: 14, background: cvStatus === "done" ? "var(--okbg)" : "var(--warm)",
                }}
              >
                {cvStatus === "idle" && (
                  <>
                    <b className="mini">Загрузить резюме</b>
                    <div className="mini muted">PDF · Word · Excel — перетащите или нажмите. Поля заполнятся автоматически.</div>
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
                    <b className="mini" style={{ color: "var(--ok)" }}>Распознано ✓ поля заполнены, файл сохранён</b>
                    <div className="mini muted">{fileName} · распознавание полей — демо, файл настоящий</div>
                  </>
                )}
                {cvStatus === "error" && (
                  <>
                    <b className="mini" style={{ color: "var(--red)" }}>Не удалось загрузить файл</b>
                    <div className="mini muted">{fileError}</div>
                  </>
                )}
              </div>

              <div className="flex gap8" style={{ marginBottom: 10 }}>
                <label className="fld" style={{ marginBottom: 0, flex: 1 }}>
                  <span>ФИО <em>*</em></span>
                  <input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="fld" style={{ marginBottom: 0, flex: 1 }}>
                  <span>Профессия</span>
                  <input className="inp" value={profession} onChange={(e) => setProfession(e.target.value)} />
                </label>
              </div>
              <div className="flex gap8" style={{ marginBottom: 10 }}>
                <label className="fld" style={{ marginBottom: 0, flex: 1 }}>
                  <span>Ожидания, сум</span>
                  <input className="inp" value={expSalary} onChange={(e) => setExpSalary(e.target.value)} />
                </label>
                <label className="fld" style={{ marginBottom: 0, flex: 1 }}>
                  <span>Этап</span>
                  <select className="inp" value={stage} onChange={(e) => setStage(e.target.value)}>
                    <option value="NEW">Поиск</option>
                    <option value="SCREENING">Скрининг</option>
                    <option value="INTERVIEW">Интервью</option>
                  </select>
                </label>
              </div>
              <label className="fld">
                <span>Навыки (через запятую)</span>
                <input
                  className="inp"
                  value={skills.join(", ")}
                  onChange={(e) => setSkills(e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                />
              </label>
              <div className="hint" style={{ marginBottom: 14 }}>Кандидат сохранится в вашу базу и добавится в канбан заявки.</div>
              <button
                className="btn btn-red btn-block"
                disabled={loading || !name.trim() || cvStatus === "parsing"}
                onClick={createAndAdd}
              >
                {loading ? "Добавляем…" : cvStatus === "parsing" ? "Дождитесь обработки файла…" : "Создать и добавить"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
