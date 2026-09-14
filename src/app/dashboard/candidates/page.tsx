import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { bestMatch } from "@/lib/matching";
import CandidatesTable from "@/components/CandidatesTable";

export default async function RecruiterCandidatesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) return null;

  const [candidates, openRequests, interviewsCount] = await Promise.all([
    prisma.candidate.findMany({
      where: { recruiterId: user.recruiterProfile.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vacancyRequest.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, moderation: "APPROVED" },
    }),
    prisma.interview.count({
      where: { candidate: { recruiterId: user.recruiterProfile.id }, status: "SCHEDULED" },
    }),
  ]);

  const withMatch = candidates.map((c) => {
    const m = bestMatch(c, openRequests);
    return {
      ...c,
      match: m ? { score: m.score, title: m.request.title, reasons: m.reasons } : null,
    };
  });

  return <CandidatesTable candidates={JSON.parse(JSON.stringify(withMatch))} interviewsCount={interviewsCount} />;
}
