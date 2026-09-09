import type { ReactNode } from "react";

export default function Top({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex" style={{ marginBottom: 20, alignItems: "flex-start" }}>
      <div>
        <h1 className="sg" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h1>
        {sub && <div className="mini muted" style={{ marginTop: 4 }}>{sub}</div>}
      </div>
      {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
    </div>
  );
}
