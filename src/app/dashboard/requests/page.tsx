import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import Top from "@/components/Top";
import RequestsTable from "@/components/RequestsTable";
import { releaseExpiredClaims } from "@/lib/autoRelease";

export default async function MyRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/dashboard/admin/stats");

  await releaseExpiredClaims();

  const where =
    user.role === "EMPLOYER"
      ? { companyId: user.company!.id }
      : { participants: { some: { recruiterId: user.recruiterProfile!.id } } };

  const requests = await prisma.vacancyRequest.findMany({
    where,
    include: { company: true, participants: { include: { recruiter: true } }, _count: { select: { candidates: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Top
        title="Мои заявки"
        sub={user.role === "EMPLOYER" ? "Заявки на подбор вашей компании" : "Заявки, которые вы закрепили"}
      />
      <RequestsTable requests={JSON.parse(JSON.stringify(requests))} role={user.role} />
    </div>
  );
}
