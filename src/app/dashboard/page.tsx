import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import EmployerOverview from "@/components/EmployerOverview";
import Exchange from "@/components/Exchange";
import Top from "@/components/Top";
import { releaseExpiredClaims } from "@/lib/autoRelease";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "ADMIN") redirect("/dashboard/admin/stats");

  await releaseExpiredClaims();

  if (user.role === "EMPLOYER" && user.company) {
    return <EmployerOverview companyId={user.company.id} />;
  }

  if (user.role === "RECRUITER" && user.recruiterProfile) {
    const requests = await prisma.vacancyRequest.findMany({
      where: { status: "OPEN", moderation: "APPROVED" },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });
    return (
      <div>
        <Top title="Биржа заявок" sub={`${requests.length} доступных заявок`} />
        <Exchange requests={JSON.parse(JSON.stringify(requests))} verified={user.recruiterProfile.verified} />
      </div>
    );
  }

  return null;
}
