import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import UsersAdminList from "@/components/admin/UsersAdminList";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    include: { company: true, recruiterProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Пользователи</h3>
        <div className="sub">Все работодатели и рекрутеры платформы</div>
      </div>
      <UsersAdminList users={JSON.parse(JSON.stringify(users))} currentUserId={user.id} />
    </div>
  );
}
