import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import SidebarNav from "@/components/SidebarNav";
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
    <div className="shell">
      <div className="side">
        <Link href="/dashboard" className="side-logo">
          <b>SNIP<i>E</i>R</b>
        </Link>
        <div className="side-role">
          <div className="ic">{displayName.slice(0, 1).toUpperCase()}</div>
          <div className="t">
            {ROLE_LABEL[user.role]}
            <b>{displayName}</b>
          </div>
        </div>
        <SidebarNav role={user.role} />
        <div className="side-foot">
          <SignOutButton />
        </div>
      </div>
      <div className="main">
        <div className="content"><div className="wrap">{children}</div></div>
      </div>
    </div>
  );
}
