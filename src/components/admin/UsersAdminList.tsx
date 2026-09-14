"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_LABEL: Record<string, string> = {
  EMPLOYER: "Работодатель",
  RECRUITER: "Рекрутер",
  ADMIN: "Админ",
};

export default function UsersAdminList({ users, currentUserId }: { users: any[]; currentUserId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editing, setEditing] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((u) => {
        const name = u.company?.name || u.recruiterProfile?.name || "";
        return u.email.toLowerCase().includes(q) || name.toLowerCase().includes(q);
      });
    }
    return list;
  }, [users, query, roleFilter]);

  const openEdit = (u: any) => {
    setEditing(u);
    setEditName(u.company?.name || u.recruiterProfile?.name || "");
    setEditEmail(u.email);
    setError("");
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/users/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: editEmail, name: editName }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Не удалось сохранить");
    }
  };

  const toggleBlock = async (u: any) => {
    const willBlock = !u.isBlocked;
    if (willBlock && !confirm(`Заблокировать ${u.company?.name || u.recruiterProfile?.name || u.email}? Он не сможет войти в аккаунт.`)) return;
    setBusyId(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: willBlock }),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Не удалось изменить статус");
    }
  };

  const deleteUser = async (u: any) => {
    const name = u.company?.name || u.recruiterProfile?.name || u.email;
    if (!confirm(`Удалить ${name} безвозвратно? Будут удалены все его заявки, кандидаты, платежи и история. Это действие нельзя отменить.`)) return;
    setBusyId(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Не удалось удалить");
    }
  };

  return (
    <div>
      <div className="flex gap8 wrapf" style={{ marginBottom: 14 }}>
        <input
          className="inp"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Поиск по имени или email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="inp" style={{ width: 180 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">Все роли</option>
          <option value="EMPLOYER">Работодатели</option>
          <option value="RECRUITER">Рекрутеры</option>
          <option value="ADMIN">Админы</option>
        </select>
      </div>

      {filtered.length === 0 && <div className="card card-p mini muted">Ничего не найдено.</div>}

      {filtered.length > 0 && (
        <div className="card" style={{ overflow: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Имя / компания</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Регистрация</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const name = u.company?.name || u.recruiterProfile?.name || "—";
                return (
                  <tr key={u.id}>
                    <td><b className="mini">{name}</b></td>
                    <td className="mini">{u.email}</td>
                    <td><span className="pill pill-info">{ROLE_LABEL[u.role] ?? u.role}</span></td>
                    <td>
                      <div className="flex gap8 wrapf">
                        {!u.emailVerified && <span className="pill pill-warn">Email не подтверждён</span>}
                        {u.isBlocked && <span className="pill pill-red">Заблокирован</span>}
                        {u.emailVerified && !u.isBlocked && <span className="pill pill-ok">Активен</span>}
                      </div>
                    </td>
                    <td className="mini">{new Date(u.createdAt).toLocaleDateString("ru-RU")}</td>
                    <td>
                      {u.role !== "ADMIN" && (
                        <div className="flex gap8">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Редактировать</button>
                          <button className="btn btn-ghost btn-sm" disabled={busyId === u.id || u.id === currentUserId} onClick={() => toggleBlock(u)}>
                            {u.isBlocked ? "Разблокировать" : "Заблокировать"}
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} disabled={busyId === u.id || u.id === currentUserId} onClick={() => deleteUser(u)}>
                            Удалить
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(20,24,30,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
          onClick={() => setEditing(null)}
        >
          <div className="card card-p" style={{ width: "100%", maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="sectit" style={{ fontSize: 14, marginBottom: 12 }}>Редактировать пользователя</div>
            <label className="fld">
              <span>{editing.role === "EMPLOYER" ? "Название компании" : "Имя"}</span>
              <input className="inp" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </label>
            <label className="fld">
              <span>Email</span>
              <input className="inp" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </label>
            {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}
            <div className="flex gap8">
              <button className="btn btn-red btn-sm" disabled={saving} onClick={saveEdit}>
                {saving ? "Сохраняем…" : "Сохранить"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
