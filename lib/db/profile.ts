import { db } from "./db";
import {
    userProfilesTable,
    roadmapsTable,
    coursesTable,
    writingStudioDocsTable,
    resumeAnalysisTable,
    resumesTable,
    chatHistoryTable,
    profileInsightsTable
} from "./schema";
import { eq, count, desc } from "drizzle-orm";

import { ProfileWithRelations } from "@/types";

/**
 * Calculates a completion percentage based on the profile fields populated.
 */
export function calculateCompletionPercentage(profile: ProfileWithRelations) {
    let score = 0;
    const weights = {
        basicInfo: 20,
        links: 10,
        skills: 15,
        projects: 20,
        experience: 15,
        education: 10,
        goals: 10
    };

    // Basic Info
    if (profile.name && profile.currentRole && profile.university && profile.location) score += weights.basicInfo;
    else if (profile.name) score += weights.basicInfo / 2;

    if (profile.links?.length > 0) score += weights.links;
    if (profile.skills?.length >= 3) score += weights.skills;
    else if (profile.skills?.length > 0) score += (weights.skills / 3) * profile.skills.length;
    if (profile.projects?.length >= 1) score += weights.projects;
    if (profile.experience?.length >= 1) score += weights.experience;
    if (profile.education?.length >= 1) score += weights.education;
    if (profile.goals) score += weights.goals;

    return Math.min(Math.round(score), 100);
}

/**
 * Fetches all user-related profile data, metrics, and insights.
 */
export async function getFullUserProfile(userEmail: string) {
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
            insights: true,
        },
    });

    if (!profile) return null;

    // Platform Metrics
    const [
        roadmapsCount,
        coursesCount,
        docsCount,
        resumesAnalysedCount,
        resumesBuiltCount,
        mentorshipChatsCount
    ] = await Promise.all([
        db.select({ value: count() }).from(roadmapsTable).where(eq(roadmapsTable.userEmail, userEmail)),
        db.select({ value: count() }).from(coursesTable).where(eq(coursesTable.userEmail, userEmail)),
        db.select({ value: count() }).from(writingStudioDocsTable).where(eq(writingStudioDocsTable.userEmail, userEmail)),
        db.select({ value: count() }).from(resumeAnalysisTable).where(eq(resumeAnalysisTable.userEmail, userEmail)),
        db.select({ value: count() }).from(resumesTable).where(eq(resumesTable.userEmail, userEmail)),
        db.select({ value: count(chatHistoryTable.chatId) }).from(chatHistoryTable).where(eq(chatHistoryTable.userEmail, userEmail))
    ]);

    const dynamicCompletion = calculateCompletionPercentage(profile);

    // Fetch latest analysis
    const latestAnalysis = await db.query.resumeAnalysisTable.findFirst({
        where: eq(resumeAnalysisTable.userEmail, userEmail),
        orderBy: [desc(resumeAnalysisTable.createdAt)]
    });

    const insights = profile.insights || {
        jobReadinessScore: 0,
        atsScore: 0,
        keywordStrength: "Low",
        projectImpact: "Weak",
        breakdown: JSON.stringify({
            resumeQuality: 0,
            projectsStrength: 0,
            skillsCoverage: 0,
            experience: 0
        }),
        suggestions: "[]",
        sectionAnalysis: "{}",
        improvementPlan: "{}"
    };

    if (latestAnalysis) {
        const analysisData = JSON.parse(latestAnalysis.analysisData);
        insights.jobReadinessScore = analysisData.score || 0;
        insights.atsScore = analysisData.scoreBreakdown?.ats || analysisData.score || 0;
        insights.breakdown = JSON.stringify({
            resumeQuality: analysisData.scoreBreakdown?.ats || 0,
            projectsStrength: analysisData.scoreBreakdown?.projects || 0,
            skillsCoverage: analysisData.scoreBreakdown?.skills || 0,
            experience: analysisData.scoreBreakdown?.experience || 0
        });
        insights.suggestions = JSON.stringify(analysisData.criticalGaps || []);
    }

    return {
        ...profile,
        insights,
        completionPercentage: dynamicCompletion,
        resumeText: latestAnalysis?.resumeText || null,
        resumeName: latestAnalysis?.resumeName || null,
        metrics: {
            roadmapsGenerated: roadmapsCount[0]?.value || 0,
            coursesGenerated: coursesCount[0]?.value || 0,
            docsGenerated: docsCount[0]?.value || 0,
            resumesAnalysed: resumesAnalysedCount[0]?.value || 0,
            resumesBuilt: resumesBuiltCount[0]?.value || 0,
            mentorshipConversations: mentorshipChatsCount[0]?.value || 0
        }
    };
}
