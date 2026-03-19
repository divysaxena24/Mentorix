import { currentUser } from "@clerk/nextjs/server";
import { getFullUserProfile } from "@/lib/db/profile";
import ProfileClientWrapper from "./ProfileClientWrapper";
import { redirect } from "next/navigation";

export default async function MentorixProfilePage() {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
        redirect("/sign-in");
    }

    const profileData = await getFullUserProfile(userEmail);

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-12">
                <ProfileClientWrapper initialProfile={profileData} />
            </div>
        </div>
    );
}
