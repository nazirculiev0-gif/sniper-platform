import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import Landing from "@/components/Landing";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <Landing />;
}
