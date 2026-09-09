import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import RequestList from "@/components/RequestList";
import CreateRequestForm from "@/components/CreateRequestForm";
import { releaseExpiredClaims } from "@/lib/autoRelease";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await releaseExpiredClaims();

  let where: any = {};
  if (user.role === "EMPLOYER") {
    where = { companyId: user.company!.id };
  } else if (user.role === "RECRUITER") {
    where = {
      OR: [
        { status: { in: ["OPEN", "IN_PROGRESS"] }, moderation: "APPROVED" },
        { participants: { some: { recruiterId: user.recruiterProfile!.id } } },
      ],
    };
  }

  const requests = await prisma.vacancyRequest.findMany({
    where,
    include: { company: true, participants: { include: { recruiter: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {user.role === "EMPLOYER" && (
        <div style={{ marginBottom: 20 }}>
          <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
            <h3>Новая заявка</h3>
          </div>
          <CreateRequestForm />
        </div>
      )}
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>{user.role === "EMPLOYER" ? "Мои заявки" : user.role === "RECRUITER" ? "Биржа заявок" : "Все заявки"}</h3>
      </div>
      <RequestList requests={JSON.parse(JSON.stringify(requests))} role={user.role} />
    </div>
  );
}
