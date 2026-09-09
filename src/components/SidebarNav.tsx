"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: Record<string, { href: string; label: string }[]> = {
  EMPLOYER: [
    { href: "/dashboard", label: "Обзор" },
    { href: "/dashboard/requests", label: "Мои заявки" },
    { href: "/dashboard/requests/new", label: "Создать заявку" },
    { href: "/dashboard/payments", label: "Выплаты" },
  ],
  RECRUITER: [
    { href: "/dashboard", label: "Биржа заявок" },
    { href: "/dashboard/requests", label: "Мои заявки" },
    { href: "/dashboard/candidates", label: "Моя база" },
    { href: "/dashboard/profile", label: "Рейтинг и профиль" },
    { href: "/dashboard/payments", label: "Выплаты" },
  ],
  ADMIN: [
    { href: "/dashboard/admin/stats", label: "Статистика" },
    { href: "/dashboard/admin/requests", label: "Модерация" },
    { href: "/dashboard/admin/recruiters", label: "Рекрутеры" },
    { href: "/dashboard/admin/finance", label: "Финансы" },
  ],
};

export default function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = NAV[role] || [];

  return (
    <div className="nav">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={`nav-i ${active ? "on" : ""}`}>
            <span className="lbl">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
