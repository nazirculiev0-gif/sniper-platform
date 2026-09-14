import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import SupportAdminView from "@/components/admin/SupportAdminView";

export default async function AdminSupportPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Поддержка</h3>
        <div className="sub">Обращения работодателей и рекрутеров</div>
      </div>
      <SupportAdminView />
    </div>
  );
}
