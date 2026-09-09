import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import ProfileEditForm from "@/components/ProfileEditForm";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) redirect("/dashboard");

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Мой публичный профиль</h3>
        <div className="sub">Виден работодателям при просмотре ваших заявок и на бирже</div>
      </div>
      <ProfileEditForm
        profile={JSON.parse(JSON.stringify(user.recruiterProfile))}
      />
    </div>
  );
}
