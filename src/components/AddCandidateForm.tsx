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
          <button className="btn btn-ghost btn-sm" style={{ marginLeft:
