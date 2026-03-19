"use server"

import { db } from "@/lib/db/db";
import {
    userProfilesTable,
    professionalLinksTable,
    userSkillsTable,
    userProjectsTable,
    userEducationTable,
    userExperienceTable,
    userAchievementsTable,
    careerGoalsTable,
    profileInsightsTable
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getUserProfileAction() {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            throw new Error("User not authenticated");
        }
        const userEmail = user.primaryEmailAddress.emailAddress;

        const profile = await db.query.userProfilesTable.findFirst({
            where: eq(userProfilesTable.userEmail, userEmail),
            with: {
                links: true,
                skills: true,
                projects: true,
                education: true,
                experience: true,
                achievements: true,
                goals: true,
                insights: true
            }
        });

        return { success: true, data: profile };
    } catch (error: unknown) {
        console.error("GET_PROFILE_ACTION_ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to fetch profile" };
    }
}

export async function updateProfileAction(type: string, data: any) {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            throw new Error("User not authenticated");
        }
        const userEmail = user.primaryEmailAddress.emailAddress;

        switch (type) {
            case "experience":
                await db.delete(userExperienceTable).where(eq(userExperienceTable.userEmail, userEmail));
                if (data.length > 0) {
                    await db.insert(userExperienceTable).values(data.map((item: any) => ({
                        userEmail,
                        company: item.company,
                        role: item.role,
                        location: item.location,
                        startDate: item.startDate,
                        endDate: item.endDate,
                        description: item.description
                    })));
                }
                break;
            case "education":
                await db.delete(userEducationTable).where(eq(userEducationTable.userEmail, userEmail));
                if (data.length > 0) {
                    await db.insert(userEducationTable).values(data.map((item: any) => ({
                        userEmail,
                        institution: item.institution,
                        degree: item.degree,
                        fieldOfStudy: item.fieldOfStudy,
                        cgpa: item.cgpa,
                        startDate: item.startDate,
                        endDate: item.endDate,
                        description: item.description
                    })));
                }
                break;
            case "achievements":
                await db.delete(userAchievementsTable).where(eq(userAchievementsTable.userEmail, userEmail));
                if (data.length > 0) {
                    await db.insert(userAchievementsTable).values(data.map((item: any) => ({
                        userEmail,
                        title: item.title,
                        description: item.description
                    })));
                }
                break;
            case "skills":
                await db.delete(userSkillsTable).where(eq(userSkillsTable.userEmail, userEmail));
                if (data.length > 0) {
                    await db.insert(userSkillsTable).values(data.map((item: any) => ({
                        userEmail,
                        category: item.category,
                        skillName: item.skillName
                    })));
                }
                break;
            case "projects":
                await db.delete(userProjectsTable).where(eq(userProjectsTable.userEmail, userEmail));
                if (data.length > 0) {
                    await db.insert(userProjectsTable).values(data.map((item: any) => ({
                        userEmail,
                        title: item.title,
                        techStack: item.techStack,
                        description: item.description,
                        links: item.links
                    })));
                }
                break;
            case "links":
                await db.delete(professionalLinksTable).where(eq(professionalLinksTable.userEmail, userEmail));
                if (data.length > 0) {
                    await db.insert(professionalLinksTable).values(data.map((item: any) => ({
                        userEmail,
                        platform: item.platform,
                        url: item.url
                    })));
                }
                break;
            case "goals":
                const existingGoals = await db.query.careerGoalsTable.findFirst({
                    where: eq(careerGoalsTable.userEmail, userEmail)
                });
                if (existingGoals) {
                    await db.update(careerGoalsTable).set(data).where(eq(careerGoalsTable.userEmail, userEmail));
                } else {
                    await db.insert(careerGoalsTable).values({ userEmail, ...data });
                }
                break;
            case "header":
                await db.update(userProfilesTable).set(data).where(eq(userProfilesTable.userEmail, userEmail));
                break;
            default:
                throw new Error("Invalid profile update type");
        }

        revalidatePath("/mentorix-profile");
        return { success: true };
    } catch (error: unknown) {
        console.error("UPDATE_PROFILE_ACTION_ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to update profile" };
    }
}
