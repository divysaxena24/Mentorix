import { currentUser } from "@clerk/nextjs/server";
import { getUserHistory } from "@/lib/db/history";
import HistoryClient from "./HistoryClient";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Activity History | Mentorix",
    description: "Track your career preparation history, roadmaps, and AI advisor conversations.",
};

export default async function HistoryPage() {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
        redirect("/sign-in");
    }

    const historyData = await getUserHistory(userEmail);

    return <HistoryClient initialData={historyData as any} />;
}
