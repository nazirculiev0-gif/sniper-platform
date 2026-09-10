import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import ProfileEditForm from "@/components/ProfileEditForm";
import CompanyProfileEditForm from "@/components/CompanyProfileEditForm";
import AvailabilityEditor from "@/components/AvailabilityEditor";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard");

  if (user.role === "RECRUITER" && user.recruiterProfile) {
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

  if (user.role === "EMPLOYER" && user.company) {
    return (
      <div>
        <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
          <h3>Профиль компании</h3>
          <div className="sub">Виден рекрутерам на бирже заявок и на публичной странице компании</div>
        </div>
        <CompanyProfileEditForm
          company={JSON.parse(JSON.stringify(user.company))}
        />
        <AvailabilityEditor />
      </div>
    );
  }

  redirect("/dashboard");
}
