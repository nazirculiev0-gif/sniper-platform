import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import ModerationList from "@/components/admin/ModerationList";

export default async function AdminRequestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const requests = await prisma.vacancyRequest.findMany({
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Модерация заявок</h3>
      </div>
      <ModerationList requests={JSON.parse(JSON.stringify(requests))} />
    </div>
  );
}
