"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function MobileSidebarWrapper({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Закрываем меню при переходе на другую страницу
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="mobile-topbar">
        <button className="burger" onClick={() => setOpen(true)} aria-label="Открыть меню">☰</button>
        <b>SNIP<span style={{ color: "var(--red)" }}>E</span>R</b>
      </div>

      <div className={`side-backdrop ${open ? "open" : ""}`} onClick={() => setOpen(false)} />

      <div className={`side ${open ? "open" : ""}`}>{children}</div>
    </>
  );
}
