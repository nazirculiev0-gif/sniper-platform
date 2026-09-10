"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const STAGE_LABEL: Record<string, string> = {
  NEW: "Новые",
  SCREENING: "Скрининг",
  INTERVIEW: "Интервью",
  OFFER: "Оффер",
  OFFER_ACCEPTED: "Оффер принят",
  HIRED: "Нанят",
  REJECTED: "Отказ",
};

const SEARCH_STATUS_LABEL: Record<string, { t: string; c: string }> = {
  active: { t: "Активно ищет", c: "pill-ok" },
  passive: { t: "Пассивно смотрит", c: "pill-info" },
  employed: { t: "Трудоустроен", c: "pill-mut" },
};

const TABS = [
  { key: "profile", label: "Профиль" },
  { key: "resume", label: "Резюме / CV" },
  { key: "files", label: "Файлы" },
  { key: "chat", label: "Переписка" },
  { key: "interviews", label: "Собеседования" },
];

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 МБ

type CandidateFile = {
  id: string;
  fileName: string;
  fileType: string | null;
  category: "RESUME" | "OTHER";
  createdAt: string;
};

type Interview = {
  id: string;
  scheduledAt: string;
  format: string | null;
  location: string | null;
  notes: string | null;
  status: "SCHEDULED" | "DONE" | "CANCELLED";
  createdAt: string;
};

const INTERVIEW_STATUS_LABEL: Record<string, { t: string; c: string }> = {
  SCHEDULED: { t: "Запланировано", c: "pill-info" },
  DONE: { t: "Прошло", c: "pill-ok" },
  CANCELLED: { t: "Отменено", c: "pill-mut" },
};

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

export default function CandidateDetailModal({
  candidate,
  canEdit,
  onClose,
  onUpdated,
}: {
  candidate: any;
  canEdit: boolean;
  onClose: () => void;
  onUpdated?: (updated: any) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("profile");
  const [note, setNote] = useState(candidate.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  const [files, setFiles] = useState<CandidateFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openUrls, setOpenUrls] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState<"RESUME" | "OTHER" | null>(null);
  const resumeInput = useRef<HTMLInputElement>(null);
  const otherInput = useRef<HTMLInputElement>(null);

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(true);
  const [interviewError, setInterviewError] = useState("");
  const [interviewSaving, setInterviewSaving] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newWhen, setNewWhen] = useState("");
  const [newFormat, setNewFormat] = useState("online");
  const [newLocation, setNewLocation] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const searchStatus = candidate.searchStatus ? SEARCH_STATUS_LABEL[candidate.searchStatus] : null;

  useEffect(() => {
    fetch(`/api/candidates/${candidate.id}/files`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setFiles(data))
      .finally(() => setFilesLoading(false));
    fetch(`/api/candidates/${candidate.id}/interviews`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setInterviews(data))
      .finally(() => setInterviewsLoading(false));
  }, [candidate.id]);

  const openResume = async () => {
    setResumeError("");
    // Открываем вкладку СРАЗУ, синхронно по клику — иначе браузер блокирует
    // window.open как всплывающее окно, если он вызван после await.
    const win = window.open("", "_blank");

    if (resumeUrl) {
      if (win) win.location.href = resumeUrl;
      return;
    }

    setResumeLoading(true);
    const res = await fetch(`/api/candidates/${candidate.id}`);
    setResumeLoading(false);
    if (!res.ok) {
      setResumeError("Не удалось загрузить файл");
      win?.close();
      return;
    }
    const full = await res.json();
    if (!full.resumeFileData) {
      setResumeError("Файл недоступен");
      win?.close();
      return;
    }
    try {
      const url = base64ToBlobUrl(full.resumeFileData, full.resumeFileType);
      setResumeUrl(url);
      if (win) win.location.href = url;
      else setResumeError("Браузер заблокировал открытие вкладки — разрешите всплывающие окна для этого сайта и нажмите ещё раз.");
    } catch {
      setResumeError("Не удалось открыть файл");
      win?.close();
    }
  };

  const openFile = async (file: CandidateFile) => {
    setFileError("");
    const win = window.open("", "_blank"); // синхронно, до await — иначе блокируется браузером

    if (openUrls[file.id]) {
      if (win) win.location.href = openUrls[file.id];
      return;
    }

    setOpeningId(file.id);
    const res = await fetch(`/api/candidates/${candidate.id}/files/${file.id}`);
    setOpeningId(null);
    if (!res.ok) {
      setFileError("Не удалось загрузить файл");
      win?.close();
      return;
    }
    const full = await res.json();
    try {
      const url = base64ToBlobUrl(full.fileData, full.fileType);
      setOpenUrls((prev) => ({ ...prev, [file.id]: url }));
      if (win) win.location.href = url;
      else setFileError("Браузер заблокировал открытие вкладки — разрешите всплывающие окна и нажмите ещё раз.");
    } catch {
      setFileError("Не удалось открыть файл");
      win?.close();
    }
  };

  const deleteFile = async (file: CandidateFile) => {
    if (!confirm(`Удалить файл «${file.fileName}»?`)) return;
    const res = await fetch(`/api/candidates/${candidate.id}/files/${file.id}`, { method: "DELETE" });
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } else {
      setFileError("Не удалось удалить файл");
    }
  };

  const uploadFile = (file: File | undefined, category: "RESUME" | "OTHER") => {
    if (!file) return;
    setFileError("");
    if (file.size > MAX_FILE_BYTES) {
      setFileError("Файл слишком большой — максимум 4 МБ");
      return;
    }
    setUploading(category);
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      const res = await fetch(`/api/candidates/${candidate.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileData: base64, category }),
      });
      setUploading(null);
      if (res.ok) {
        const created = await res.json();
        setFiles((prev) => [created, ...prev]);
        router.refresh();
      } else {
        setFileError("Не удалось загрузить файл");
      }
    };
    reader.onerror = () => {
      setUploading(null);
      setFileError("Не удалось прочитать файл");
    };
    reader.readAsDataURL(file);
  };

  const scheduleInterview = async () => {
    if (!newWhen) {
      setInterviewError("Укажите дату и время");
      return;
    }
    setInterviewError("");
    setInterviewSaving(true);
    const res = await fetch(`/api/candidates/${candidate.id}/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt: new Date(newWhen).toISOString(),
        format: newFormat || undefined,
        location: newLocation || undefined,
        notes: newNotes || undefined,
      }),
    });
    setInterviewSaving(false);
    if (res.ok) {
      const created = await res.json();
      setInterviews((prev) => [created, ...prev]);
      setShowScheduleForm(false);
      setNewWhen("");
      setNewLocation("");
      setNewNotes("");
      router.refresh();
    } else {
      setInterviewError("Не удалось запланировать собеседование");
    }
  };

  const cancelInterview = async (interview: Interview) => {
    if (!confirm("Отменить это собеседование?")) return;
    const res = await fetch(`/api/candidates/${candidate.id}/interviews/${interview.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInterviews((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      router.refresh();
    } else {
      setInterviewError("Не удалось отменить собеседование");
    }
  };

  const markInterviewDone = async (interview: Interview) => {
    const res = await fetch(`/api/candidates/${candidate.id}/interviews/${interview.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInterviews((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    }
  };

  const saveNote = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/candidates/${candidate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setSaved(true);
      onUpdated?.(updated);
      router.refresh();
    }
  };

  const resumeFiles = files.filter((f) => f.category === "RESUME");
  const otherFiles = files.filter((f) => f.category === "OTHER");

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(20,24,30,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={onClose}
    >
      <div className="card" style={{ width: "min(640px, 100%)", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <h3 style={{ fontSize: 15 }}>{candidate.name}</h3>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={onClose}>×</button>
        </div>

        <div style={{ padding: "16px 18px 0" }}>
          <div className="flex gap8" style={{ alignItems: "center", marginBottom: 14 }}>
            <div className="av" style={{ width: 44, height: 44, fontSize: 16, background: "var(--dark)" }}>
              {candidate.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="flex gap8" style={{ alignItems: "center" }}>
                <b className="sg" style={{ fontSize: 15 }}>{candidate.name}</b>
                {searchStatus && <span className={`pill ${searchStatus.c}`}>{searchStatus.t}</span>}
              </div>
              <div className="mini muted">{candidate.profession || "Профессия не указана"}</div>
            </div>
          </div>
        </div>

        <div className="flex gap8 wrapf" style={{ padding: "0 18px", borderBottom: "1px solid var(--line)" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ background: "none", border: "none", borderBottom: tab === t.key ? "2px solid var(--red)" : "2px solid transparent", color: tab === t.key ? "var(--red)" : "var(--mid)", fontWeight: 600, fontSize: 12.5, padding: "8px 4px", marginRight: 14, cursor: "pointer" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 18 }}>
          {tab === "profile" && (
            <div>
              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                <div className="flex" style={{ justifyContent: "space-between" }}>
                  <span className="mini muted">Профессия</span>
                  <b className="mini">{candidate.profession || "—"}</b>
                </div>
                <div className="flex" style={{ justifyContent: "space-between" }}>
                  <span className="mini muted">Ожидаемая ЗП</span>
                  <b className="mini">{fmtSum(candidate.expSalary)}</b>
                </div>
                <div className="flex" style={{ justifyContent: "space-between" }}>
                  <span className="mini muted">Источник</span>
                  <b className="mini">{candidate.source || "—"}</b>
                </div>
                <div className="flex" style={{ justifyContent: "space-between" }}>
                  <span className="mini muted">Добавлен</span>
                  <b className="mini">{fmtDate(candidate.createdAt)}</b>
                </div>
                {candidate.recruiter?.name && (
                  <div className="flex" style={{ justifyContent: "space-between" }}>
                    <span className="mini muted">Рекрутер</span>
                    <b className="mini">{candidate.recruiter.name}</b>
                  </div>
                )}
              </div>

              {candidate.skills?.length > 0 && (
                <>
                  <div className="mini muted" style={{ marginBottom: 6 }}>Навыки</div>
                  <div className="flex gap8 wrapf" style={{ marginBottom: 16 }}>
                    {candidate.skills.map((s: string) => <span key={s} className="tag">{s}</span>)}
                  </div>
                </>
              )}

              <div className="card card-p" style={{ background: "var(--okbg)", borderColor: "transparent", marginBottom: 16 }}>
                <span className="mini">По текущей заявке: этап <b>{STAGE_LABEL[candidate.stage] || candidate.stage}</b></span>
              </div>

              <label className="fld">
                <span>Заметки</span>
                <textarea
                  className="inp"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  readOnly={!canEdit}
                  placeholder={canEdit ? "Впечатления от разговора, договорённости…" : "Заметок пока нет"}
                  style={{ minHeight: 80 }}
                />
              </label>
              {canEdit && (
                <div className="flex gap8" style={{ alignItems: "center" }}>
                  <button className="btn btn-red btn-sm" disabled={saving} onClick={saveNote}>
                    {saving ? "Сохраняем…" : "Сохранить заметку"}
                  </button>
                  {saved && <span className="mini" style={{ color: "var(--ok)" }}>Сохранено</span>}
                </div>
              )}
            </div>
          )}

          {tab === "resume" && (
            <div>
              {candidate.resumeFileName && (
                <div className="card card-p" style={{ marginBottom: 10 }}>
                  <div className="flex gap8" style={{ alignItems: "center" }}>
                    <div>
                      <b className="mini" style={{ display: "block" }}>{candidate.resumeFileName}</b>
                      <span className="mini muted">Загружено при создании карточки</span>
                    </div>
                    <button className="btn btn-red btn-sm" style={{ marginLeft: "auto" }} disabled={resumeLoading} onClick={openResume}>
                      {resumeLoading ? "Открываем…" : "Открыть"}
                    </button>
                  </div>
                  {resumeError && <div className="mini" style={{ color: "var(--red)", marginTop: 6 }}>{resumeError}</div>}
                  {resumeUrl && (
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="mini" style={{ display: "block", marginTop: 6, color: "var(--info)" }}>
                      Файл не открылся автоматически? Откройте по этой ссылке
                    </a>
                  )}
                </div>
              )}

              {filesLoading && <div className="mini muted">Загрузка…</div>}
              {!filesLoading && resumeFiles.map((f) => (
                <FileRow
                  key={f.id}
                  file={f}
                  canEdit={canEdit}
                  opening={openingId === f.id}
                  onOpen={() => openFile(f)}
                  onDelete={() => deleteFile(f)}
                />
              ))}

              {!filesLoading && !candidate.resumeFileName && resumeFiles.length === 0 && (
                <div className="mini muted" style={{ marginBottom: 10 }}>Резюме ещё не прикреплено.</div>
              )}

              {canEdit && (
                <>
                  <input
                    ref={resumeInput}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => { uploadFile(e.target.files?.[0], "RESUME"); e.target.value = ""; }}
                  />
                  <button className="btn btn-ghost btn-sm" disabled={uploading === "RESUME"} onClick={() => resumeInput.current?.click()}>
                    {uploading === "RESUME" ? "Загружаем…" : "+ Загрузить резюме"}
                  </button>
                </>
              )}
              {fileError && <div className="mini" style={{ color: "var(--red)", marginTop: 8 }}>{fileError}</div>}
            </div>
          )}

          {tab === "files" && (
            <div>
              {filesLoading && <div className="mini muted">Загрузка…</div>}
              {!filesLoading && otherFiles.length === 0 && (
                <div className="mini muted" style={{ marginBottom: 10 }}>Файлов пока нет.</div>
              )}
              {!filesLoading && otherFiles.map((f) => (
                <FileRow
                  key={f.id}
                  file={f}
                  canEdit={canEdit}
                  opening={openingId === f.id}
                  onOpen={() => openFile(f)}
                  onDelete={() => deleteFile(f)}
                />
              ))}
              {canEdit && (
                <>
                  <input
                    ref={otherInput}
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => { uploadFile(e.target.files?.[0], "OTHER"); e.target.value = ""; }}
                  />
                  <button className="btn btn-ghost btn-sm" disabled={uploading === "OTHER"} onClick={() => otherInput.current?.click()}>
                    {uploading === "OTHER" ? "Загружаем…" : "+ Загрузить файл"}
                  </button>
                </>
              )}
              {fileError && <div className="mini" style={{ color: "var(--red)", marginTop: 8 }}>{fileError}</div>}
            </div>
          )}

          {tab === "chat" && (
            <div className="mini muted">Переписка ведётся в общем чате заявки — откройте вкладку «Чат» на странице заявки.</div>
          )}

          {tab === "interviews" && (
            <div>
              {interviewsLoading && <div className="mini muted">Загрузка…</div>}
              {!interviewsLoading && interviews.length === 0 && !showScheduleForm && (
                <div className="mini muted" style={{ marginBottom: 10 }}>Собеседования пока не запланированы.</div>
              )}
              {!interviewsLoading && interviews.map((iv) => {
                const st = INTERVIEW_STATUS_LABEL[iv.status];
                const when = new Date(iv.scheduledAt).toLocaleString("ru-RU", {
                  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div key={iv.id} className="card card-p" style={{ marginBottom: 8 }}>
                    <div className="flex gap8" style={{ alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b className="mini" style={{ display: "block" }}>{when}</b>
                        <span className="mini muted">
                          {iv.format || "Формат не указан"}{iv.location ? ` · ${iv.location}` : ""}
                        </span>
                        {iv.notes && <div className="mini muted" style={{ marginTop: 4 }}>{iv.notes}</div>}
                      </div>
                      <span className={`pill ${st.c}`} style={{ flexShrink: 0 }}>{st.t}</span>
                    </div>
                    {canEdit && iv.status === "SCHEDULED" && (
                      <div className="flex gap8" style={{ marginTop: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => markInterviewDone(iv)}>Прошло</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={() => cancelInterview(iv)}>Отменить</button>
                      </div>
                    )}
                  </div>
                );
              })}

              {canEdit && !showScheduleForm && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowScheduleForm(true)}>
                  + Запланировать собеседование
                </button>
              )}

              {canEdit && showScheduleForm && (
                <div className="card card-p" style={{ marginTop: 4 }}>
                  <label className="fld">
                    <span>Дата и время <em>*</em></span>
                    <input className="inp" type="datetime-local" value={newWhen} onChange={(e) => setNewWhen(e.target.value)} />
                  </label>
                  <label className="fld">
                    <span>Формат</span>
                    <select className="inp" value={newFormat} onChange={(e) => setNewFormat(e.target.value)}>
                      <option value="online">Онлайн</option>
                      <option value="offline">Очно</option>
                    </select>
                  </label>
                  <label className="fld">
                    <span>Ссылка на звонок / адрес</span>
                    <input className="inp" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder={newFormat === "online" ? "Ссылка на Zoom/Meet" : "Адрес офиса"} />
                  </label>
                  <label className="fld">
                    <span>Заметка</span>
                    <textarea className="inp" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} style={{ minHeight: 60 }} />
                  </label>
                  {interviewError && <div className="mini" style={{ color: "var(--red)", marginBottom: 8 }}>{interviewError}</div>}
                  <div className="flex gap8">
                    <button className="btn btn-red btn-sm" disabled={interviewSaving} onClick={scheduleInterview}>
                      {interviewSaving ? "Сохраняем…" : "Запланировать"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowScheduleForm(false)}>Отмена</button>
                  </div>
                </div>
              )}

              {!canEdit && interviewError && <div className="mini" style={{ color: "var(--red)" }}>{interviewError}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function base64ToBlobUrl(base64: string, mimeType?: string | null) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType || "application/octet-stream" });
  return URL.createObjectURL(blob);
}

function FileRow({
  file,
  canEdit,
  opening,
  onOpen,
  onDelete,
}: {
  file: CandidateFile;
  canEdit: boolean;
  opening: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card card-p flex gap8" style={{ alignItems: "center", marginBottom: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b className="mini" style={{ display: "block" }}>{file.fileName}</b>
        <span className="mini muted">{new Date(file.createdAt).toLocaleDateString("ru-RU")}</span>
      </div>
      <button className="btn btn-ghost btn-sm" disabled={opening} onClick={onOpen}>
        {opening ? "…" : "Открыть"}
      </button>
      {canEdit && (
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={onDelete}>
          Удалить
        </button>
      )}
    </div>
  );
}
