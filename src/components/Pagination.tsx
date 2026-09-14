"use client";

export default function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex gap8" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
      <span className="mini muted">{from}–{to} из {total}</span>
      <div className="flex gap8" style={{ alignItems: "center" }}>
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Назад
        </button>
        <span className="mini">{page} / {pageCount}</span>
        <button className="btn btn-ghost btn-sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
          Вперёд →
        </button>
      </div>
    </div>
  );
}
