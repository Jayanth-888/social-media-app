import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { EditProfileForm } from "@/components/profile/edit-profile-form";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { bio: true, headline: true, profileImage: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold">Edit profile</h1>
      <EditProfileForm
        userId={session.user.id}
        initialBio={user.bio}
        initialHeadline={user.headline}
        initialProfileImage={user.profileImage}
      />
    </div>
  );
}