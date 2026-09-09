import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import Top from "@/components/Top";
import CreateRequestForm from "@/components/CreateRequestForm";

export default async function NewRequestPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") redirect("/dashboard");

  return (
    <div>
      <Top title="Создать заявку" sub="Опишите вакансию, выберите тариф и опубликуйте на биржу" />
      <CreateRequestForm forceOpen />
    </div>
  );
}
