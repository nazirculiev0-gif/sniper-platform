"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Briefcase,
  PlusCircle,
  Wallet,
  Search,
  Users,
  Star,
  BarChart3,
  ShieldCheck,
  UserCheck,
  Landmark,
  type LucideIcon,
} from "lucide-react";

const NAV: Record<string, { href: string; label: string; icon: LucideIcon }[]> = {
  EMPLOYER: [
    { href: "/dashboard", label: "Обзор", icon: LayoutGrid },
    { href: "/dashboard/requests", label: "Мои заявки", icon: Briefcase },
    { href: "/dashboard/requests/new", label: "Создать заявку", icon: PlusCircle },
    { href: "/dashboard/payments", label: "Выплаты", icon: Wallet },
  ],
  RECRUITER: [
    { href: "/dashboard", label: "Биржа заявок", icon: Search },
    { href: "/dashboard/requests", label: "Мои заявки", icon: Briefcase },
    { href: "/dashboard/candidates", label: "Моя база", icon: Users },
    { href: "/dashboard/profile", label: "Рейтинг и профиль", icon: Star },
    { href: "/dashboard/payments", label: "Выплаты", icon: Wallet },
  ],
  ADMIN: [
    { href: "/dashboard/admin/stats", label: "Статистика", icon: BarChart3 },
    { href: "/dashboard/admin/requests", label: "Модерация", icon: ShieldCheck },
    { href: "/dashboard/admin/recruiters", label: "Рекрутеры", icon: UserCheck },
    { href: "/dashboard/admin/finance", label: "Финансы", icon: Landmark },
  ],
};

export default function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = NAV[role] || [];

  return (
    <div className="nav">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={`nav-i ${active ? "on" : ""}`}>
            <Icon size={18} />
            <span className="lbl">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
