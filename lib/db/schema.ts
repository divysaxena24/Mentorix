import { integer, pgTable, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
});

export const chatHistoryTable = pgTable("chat_history", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    chatId: varchar({ length: 255 }).notNull(),
    chatTitle: varchar({ length: 255 }),
    userEmail: varchar({ length: 255 }).notNull(),
    role: varchar({ length: 20 }).notNull(),
    content: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
});

export const roadmapsTable = pgTable("roadmaps", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    targetField: varchar({ length: 255 }).notNull(),
    roadmapData: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
});

export const coverLettersTable = pgTable("cover_letters", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    jobDescription: text().notNull(),
    userDetails: text().notNull(),
    coverLetter: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
});

export const resumeAnalysisTable = pgTable("resume_analysis", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    resumeText: text().notNull(),
    jobDescription: text(),
    analysisData: text().notNull(),
    resumeName: varchar({ length: 255 }),
    createdAt: timestamp().defaultNow().notNull(),
});

export const sharedChatsTable = pgTable("shared_chats", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    chatId: varchar({ length: 255 }).notNull().unique(),
    createdAt: timestamp().defaultNow().notNull(),
});

export const resumesTable = pgTable("resumes", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    resumeName: varchar({ length: 255 }).notNull(),
    resumeData: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});

export const writingStudioDocsTable = pgTable("writing_studio_docs", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    docType: varchar({ length: 50 }).notNull(), // e.g., 'cover_letter', 'sop', 'motivation_letter', 'proposal'
    context: text().notNull(), // Job Description, Company context, etc.
    userDetails: text().notNull(), // Experience, achievements, summary
    generatedContent: text().notNull(), // The final output
    createdAt: timestamp().defaultNow().notNull(),
});

export const coursesTable = pgTable("courses", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    roadmapId: integer(),
    milestoneId: integer(),
    title: varchar({ length: 255 }).notNull(),
    level: varchar({ length: 50 }), // Beginner, Intermediate, Advanced
    duration: varchar({ length: 100 }), // e.g., "8 weeks"
    goalType: varchar({ length: 100 }), // Interview Prep, Mastery, etc.
    description: text(),
    outcomes: text(), // JSON string
    capstoneProject: text(),
    estimatedHours: integer(),
    generationStatus: varchar({ length: 50 }).default("pending"), // pending, generating, completed, failed
    content: text().notNull(), // Compatibility for old structure
    createdAt: timestamp().defaultNow().notNull(),
});

export const courseModulesTable = pgTable("course_modules", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    courseId: integer().references(() => coursesTable.id, { onDelete: 'cascade' }),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    order: integer().notNull(),
    estimatedHours: integer(),
});

export const courseLessonsTable = pgTable("course_lessons", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    moduleId: integer().references(() => courseModulesTable.id, { onDelete: 'cascade' }),
    title: varchar({ length: 255 }).notNull(),
    depthLevel: varchar({ length: 50 }),
    explanation: text(), // 800+ words
    realWorldExample: text(),
    codeExample: text(),
    commonMistakes: text(), // JSON string
    exercise: text(),
    interviewQuestions: text(), // JSON string
    content: text().notNull(), // Compatibility for raw content
    takeaways: text().notNull(), // Compatibility
    summary: text(),
    quiz: text(),
    videoUrl: text(),
    videoTitle: text(),
    order: integer().notNull(),
});

export const courseProgressTable = pgTable("course_progress", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    lessonId: integer().references(() => courseLessonsTable.id, { onDelete: 'cascade' }),
    completed: boolean().default(false).notNull(),
    quizScore: integer(),
    updatedAt: timestamp().defaultNow().notNull(),
});

// Mentorix Profile Tables
export const userProfilesTable = pgTable("user_profiles", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull().unique(),
    name: varchar({ length: 255 }),
    profilePhoto: text(),
    currentRole: varchar({ length: 255 }),
    university: varchar({ length: 255 }),
    location: varchar({ length: 255 }),
    internshipsCount: integer().default(0),
    leetcodeCount: integer().default(0),
    completionPercentage: integer().default(0),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});

export const professionalLinksTable = pgTable("professional_links", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    platform: varchar({ length: 50 }).notNull(), // GitHub, LinkedIn, etc.
    url: text().notNull(),
});

export const userSkillsTable = pgTable("user_skills", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    category: varchar({ length: 50 }).notNull(), // Languages, Frontend, etc.
    skillName: varchar({ length: 255 }).notNull(),
});

export const userProjectsTable = pgTable("user_projects", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    techStack: text().notNull(), // JSON or comma-separated
    description: text().notNull(),
    links: text(), // JSON string for multiple links
});

export const careerGoalsTable = pgTable("career_goals", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull().unique(),
    targetRole: varchar({ length: 255 }),
    preferredDomain: varchar({ length: 255 }),
    targetCompanies: text(), // Comma-separated or JSON
});

export const profileInsightsTable = pgTable("profile_insights", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull().unique(),
    jobReadinessScore: integer().default(0),
    breakdown: text(), // JSON string for score breakdown
    atsScore: integer().default(0),
    keywordStrength: varchar({ length: 20 }), // Low, Medium, Strong
    projectImpact: varchar({ length: 20 }), // Weak, Medium, Strong
    suggestions: text(), // JSON string for AI suggestions
    sectionAnalysis: text(), // JSON string for detailed section analysis
    improvementPlan: text(), // JSON string for improvement plan
    updatedAt: timestamp().defaultNow().notNull(),
});

export const userEducationTable = pgTable("user_education", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    institution: varchar({ length: 255 }).notNull(),
    degree: varchar({ length: 255 }),
    fieldOfStudy: varchar({ length: 255 }),
    cgpa: varchar({ length: 20 }),
    startDate: varchar({ length: 50 }),
    endDate: varchar({ length: 50 }),
    description: text(),
});

export const userExperienceTable = pgTable("user_experience", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    company: varchar({ length: 255 }).notNull(),
    role: varchar({ length: 255 }).notNull(),
    location: varchar({ length: 255 }),
    startDate: varchar({ length: 50 }),
    endDate: varchar({ length: 50 }),
    description: text(),
});

export const userAchievementsTable = pgTable("user_achievements", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
});

// Relations
export const userProfilesRelations = relations(userProfilesTable, ({ many, one }) => ({
    links: many(professionalLinksTable),
    skills: many(userSkillsTable),
    projects: many(userProjectsTable),
    education: many(userEducationTable),
    experience: many(userExperienceTable),
    achievements: many(userAchievementsTable),
    goals: one(careerGoalsTable, {
        fields: [userProfilesTable.userEmail],
        references: [careerGoalsTable.userEmail],
    }),
    insights: one(profileInsightsTable, {
        fields: [userProfilesTable.userEmail],
        references: [profileInsightsTable.userEmail],
    }),
}));

export const professionalLinksRelations = relations(professionalLinksTable, ({ one }) => ({
    profile: one(userProfilesTable, {
        fields: [professionalLinksTable.userEmail],
        references: [userProfilesTable.userEmail],
    }),
}));

export const userSkillsRelations = relations(userSkillsTable, ({ one }) => ({
    profile: one(userProfilesTable, {
        fields: [userSkillsTable.userEmail],
        references: [userProfilesTable.userEmail],
    }),
}));

export const userProjectsRelations = relations(userProjectsTable, ({ one }) => ({
    profile: one(userProfilesTable, {
        fields: [userProjectsTable.userEmail],
        references: [userProfilesTable.userEmail],
    }),
}));

export const userEducationRelations = relations(userEducationTable, ({ one }) => ({
    profile: one(userProfilesTable, {
        fields: [userEducationTable.userEmail],
        references: [userProfilesTable.userEmail],
    }),
}));

export const userExperienceRelations = relations(userExperienceTable, ({ one }) => ({
    profile: one(userProfilesTable, {
        fields: [userExperienceTable.userEmail],
        references: [userProfilesTable.userEmail],
    }),
}));

export const userAchievementsRelations = relations(userAchievementsTable, ({ one }) => ({
    profile: one(userProfilesTable, {
        fields: [userAchievementsTable.userEmail],
        references: [userProfilesTable.userEmail],
    }),
}));

export const coursesRelations = relations(coursesTable, ({ many }) => ({
    modules: many(courseModulesTable),
}));

export const courseModulesRelations = relations(courseModulesTable, ({ one, many }) => ({
    course: one(coursesTable, {
        fields: [courseModulesTable.courseId],
        references: [coursesTable.id],
    }),
    lessons: many(courseLessonsTable),
}));

export const courseLessonsRelations = relations(courseLessonsTable, ({ one, many }) => ({
    module: one(courseModulesTable, {
        fields: [courseLessonsTable.moduleId],
        references: [courseModulesTable.id],
    }),
    progress: many(courseProgressTable),
}));

export const courseProgressRelations = relations(courseProgressTable, ({ one }) => ({
    lesson: one(courseLessonsTable, {
        fields: [courseProgressTable.lessonId],
        references: [courseLessonsTable.id],
    }),
}));

// AI Mock Interview Tables
export const mockInterviewsTable = pgTable("mock_interviews", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userEmail: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 50 }).notNull(), // 'Resume-Based', 'Custom'
    topic: varchar({ length: 255 }).notNull(),
    duration: varchar({ length: 50 }).notNull(), // e.g., '15 min', '30 min'
    difficulty: varchar({ length: 50 }).notNull(), // 'Easy', 'Medium', 'Hard'
    status: varchar({ length: 50 }).default('In-Progress').notNull(), // 'In-Progress', 'Completed'
    overallScore: integer(),
    metrics: text(), // JSON string for { technicalKnowledge: 8, communication: 7, etc. }
    generalFeedback: text(), // JSON string for { strengths: [], weaknesses: [], suggestions: [] }
    createdAt: timestamp().defaultNow().notNull(),
});

export const interviewQuestionsTable = pgTable("interview_questions", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    interviewId: integer().references(() => mockInterviewsTable.id, { onDelete: 'cascade' }),
    questionText: text().notNull(),
    idealAnswer: text(),
    userTranscript: text(),
    aiEvaluationText: text(),
    score: integer(),
    sequenceOrder: integer().notNull(),
});

// Mock Interview Relations
export const mockInterviewsRelations = relations(mockInterviewsTable, ({ many }) => ({
    questions: many(interviewQuestionsTable),
}));

export const interviewQuestionsRelations = relations(interviewQuestionsTable, ({ one }) => ({
    interview: one(mockInterviewsTable, {
        fields: [interviewQuestionsTable.interviewId],
        references: [mockInterviewsTable.id],
    }),
}));
