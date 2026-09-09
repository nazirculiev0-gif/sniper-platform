import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import SignOutButton from "@/components/SignOutButton";

const ROLE_LABEL: Record<string, string> = {
  EMPLOYER: "Работодатель",
  RECRUITER: "Рекрутер",
  ADMIN: "Администратор",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const displayName = user.company?.name ?? user.recruiterProfile?.name ?? user.email;

  return (
    <div className="shell" style={{ gridTemplateColumns: "1fr" }}>
      <div className="main">
        <div className="top">
          <div>
            <h1>SNIPER<span style={{ color: "var(--red)" }}>.</span></h1>
            <div className="sub">{ROLE_LABEL[user.role]} · {displayName}</div>
          </div>
          {user.role === "RECRUITER" && (
            <nav className="flex gap8" style={{ marginLeft: "auto" }}>
              <a href="/dashboard" className="btn btn-ghost btn-sm">Биржа</a>
              <a href="/dashboard/candidates" className="btn btn-ghost btn-sm">Моя база</a>
              <a href="/dashboard/profile" className="btn btn-ghost btn-sm">Профиль</a>
            </nav>
          )}
          {user.role === "ADMIN" && (
            <nav className="flex gap8" style={{ marginLeft: "auto" }}>
              <a href="/dashboard/admin/requests" className="btn btn-ghost btn-sm">Модерация</a>
              <a href="/dashboard/admin/recruiters" className="btn btn-ghost btn-sm">Рекрутеры</a>
              <a href="/dashboard/admin/finance" className="btn btn-ghost btn-sm">Финансы</a>
            </nav>
          )}
          <div style={{ marginLeft: user.role === "EMPLOYER" ? "auto" : 0 }}>
            <SignOutButton />
          </div>
        </div>
        <div className="content"><div className="wrap">{children}</div></div>
      </div>
    </div>
  );
}
