import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import RecruitersList from "@/components/admin/RecruitersList";

export default async function AdminRecruitersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const recruiters = await prisma.recruiterProfile.findMany({
    include: { user: true, _count: { select: { candidates: true, participations: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Рекрутеры</h3>
      </div>
      <RecruitersList recruiters={JSON.parse(JSON.stringify(recruiters))} />
    </div>
  );
}
