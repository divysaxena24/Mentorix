// ===== Roadmap Types (Legacy - backward compatibility) =====
export interface Milestone {
    week: string;
    goal: string;
    topics: string[];
    resources: string[];
    detailedSteps: string[];
}

export interface RoadmapResult {
    id?: number;
    title: string;
    description: string;
    milestones: Milestone[];
    tips: string[];
    createdAt?: string;
    targetField?: string;
}

export interface RoadmapItem {
    id: number;
    targetField: string;
    createdAt: string;
    roadmapData: RoadmapResult;
}

// ===== Premium Career Roadmap Types =====

/**
 * Resources for a single week of the roadmap.
 */
export interface WeeklyResources {
    courses: string[];
    docs: string[];
    videos: string[];
    articles: string[];
}

/**
 * A single week/milestone in the premium roadmap.
 */
export interface PremiumMilestone {
    weekNumber: number;
    dateRange: string;
    milestoneTitle: string;
    objective: string;
    difficulty: string;
    estimatedHours: number;
    learningFocus: string[];
    actionableTasks: string[];
    buildThisWeek: string;
    resources: WeeklyResources;
    expectedOutcome: string[];
    resumeImpact: "Low" | "Medium" | "High";
    interviewTopicsCovered: string[];
}

/**
 * Checkpoint assessment every 4 weeks.
 */
export interface Checkpoint {
    weekNumber: number;
    title: string;
    quiz: string[];
    miniProject: string;
    skillValidation: string[];
    progressReview: string;
}

/**
 * Header metadata for the premium roadmap.
 */
export interface RoadmapHeader {
    roadmapTitle: string;
    professionalOverview: string;
    targetRole: string;
    targetCompany?: string;
    currentLevel: string;
    weeklyCommitment: string;
    startDate: string;
    expectedCompletionDate: string;
    totalDuration: string;
    estimatedOutcome: string;
}

/**
 * Final summary at the end of the roadmap.
 */
export interface FinalSummary {
    skillsGained: string[];
    projectsBuilt: string[];
    interviewAreasCovered: string[];
    resumeImprovements: string[];
    expectedReadinessScore: number;
    readinessTarget: string;
}

/**
 * The complete premium roadmap result returned from the API.
 */
export interface PremiumRoadmap {
    id?: number;
    header: RoadmapHeader;
    milestones: PremiumMilestone[];
    checkpoints: Checkpoint[];
    tips: string[];
    finalSummary: FinalSummary;
    createdAt?: string;
    targetField?: string;
}

/**
 * Union type so the frontend can display both old and new formats.
 */
export type AnyRoadmap = RoadmapResult | PremiumRoadmap;

/**
 * All possible inputs for the roadmap generator.
 */
export interface RoadmapInputs {
    targetRole: string;
    careerGoal: string;
    currentLevel: string;
    weeklyHours: string;
    duration: string;
    startDate: string;
    existingSkills: string;
    missingSkills: string;
    targetCompany: string;
}

// Resume Analysis Types
export interface AnalysisResult {
    // Core (backward compatible)
    score: number;
    summary: string;
    scoreBreakdown: {
        skills: number;
        projects: number;
        experience: number;
        ats: number;
        impact: number;
        industryFit: number;
    };
    strengths: string[];
    criticalGaps: string[];
    improvementPoints: string[];
    missingKeywords: string[];
    sectionwiseAnalysis: {
        education: string;
        experience: string;
        projects: string;
        skills: string;
    };
    improvementPlan?: {
        additionalSkills: string[];
        newProjectIdeas: string[];
        projectEnhancements: string[];
    };

    // === NEW ENHANCED FIELDS (optional for backward compat) ===

    // 1. Executive Summary
    executiveSummary?: {
        professionalOverview: string;
        careerStageAssessment: string;
        top3Strengths: string[];
        top3Improvements: string[];
        overallHiringImpression: string;
    };

    // 2. Extended Scores
    extendedScores?: {
        overallResume: number;
        ats: number;
        technicalStrength: number;
        projectQuality: number;
        experience: number;
        industryReadiness: number;
        communication: number;
        leadership: number;
    };
    scoreExplanations?: Record<string, string>;

    // 3. ATS Keyword Analysis
    atsKeywordAnalysis?: {
        matchedKeywords: string[];
        missingKeywords: string[];
        keywordMatchPercentage: number;
        keywordCoverageHeatmap: { category: string; percentage: number }[];
        mostImportantMissingKeywords: string[];
        impactOfMissingKeywords: string;
    };

    // === CORE EXTRACTION ===
    extractedEntities?: {
        projects: { name: string; technologies: string[]; description: string; domain?: string; hasAI?: boolean; complexity?: string }[];
        experiences: { role: string; company: string; duration: string; description: string; isResearch?: boolean; isInternship?: boolean }[];
        skills: string[];
        education: string[];
        achievements: string[];
        certifications: string[];
        technologies: string[];
        leadershipActivities: string[];
        researchWork: string[];
        hackathons?: string[];
        openSource?: string[];
    };

    // === SMART SKILL INFERENCE ===
    skillInference?: {
        inferredSkills: { skill: string; source: string; confidence: string }[];
    };

    // === ENHANCED SKILLS ANALYSIS (16 categories) ===
    skillsAnalysis?: {
        categories: Record<string, {
            detected: string[];
            inferred: string[];
            missing: string[];
            importanceScore: number;
            marketDemandScore: number;
        }>;
        strongAreas: string[];
        missingAreas: string[];
        skillBalanceScore: number;
        learningRecommendations: string[];
    };

    // === ENHANCED PROJECT ANALYSIS ===
    projectAnalysis?: {
        projectName: string;
        technologyStack: string[];
        domain?: string;
        complexity?: string;
        technicalComplexity: number;
        architectureQuality: number;
        scalabilityScore: number;
        innovationScore: number;
        industryRelevance: number;
        resumeValue: number;
        recruiterAppeal: number;
        strengths: string[];
        weaknesses: string[];
        missingTechnologies: string[];
        missingEngineeringPractices: string[];
        suggestedMetrics: string[];
        suggestedResumeRewrite: string;
        suggestedFutureEnhancements: string[];
        recruiterImpression: string;
    }[];

    // === PROJECT COMPARISON ENGINE ===
    projectComparison?: {
        rankingTable: {
            project: string;
            technicalDepth: number;
            scalability: number;
            innovation: number;
            industryRelevance: number;
            resumeValue: number;
            overallRank: number;
        }[];
        strongestProject: string;
        weakestProject: string;
        mostRecruiterFriendly: string;
        mostTechnicallyImpressive: string;
        mostInnovative: string;
        projectThatShouldAppearFirst: string;
        projectThatShouldBeImproved: string;
        portfolioDiversityAnalysis: string;
    };

    // === ENHANCED EXPERIENCE ANALYSIS ===
    experienceAnalysis?: {
        role: string;
        organization: string;
        duration: string;
        isResearch?: boolean;
        isInternship?: boolean;
        technicalDepth: number;
        businessImpact: number;
        ownership: number;
        leadershipScore: number;
        communicationScore: number;
        problemSolving: number;
        metricsUsage: number;
        recruiterAppeal: number;
        strengths: string[];
        weaknesses: string[];
        missingMetrics: string[];
        weakBulletPoints: string[];
        improvedBullets: string[];
        suggestedQuantifiableAchievements: string[];
        recruiterImpression: string;
    }[];

    // === EXPERIENCE COMPARISON ENGINE ===
    experienceComparison?: {
        mostValuableExperience: string;
        mostTechnicalExperience: string;
        mostImpactfulExperience: string;
        mostRecruiterFriendly: string;
        experienceNeedingRewrite: string;
        experienceNeedingMoreMetrics: string;
    };

    // === PORTFOLIO INTELLIGENCE ===
    portfolioIntelligence?: {
        portfolioStrengthScore: number;
        projectDiversityScore: number;
        experienceStrengthScore: number;
        leadershipScore: number;
        researchScore: number;
        industryReadinessScore: number;
        careerGrowthPotentialScore: number;
        faangPotentialScore: number;
        startupReadinessScore: number;
        enterpriseReadinessScore: number;
    };

    // === MARKET BENCHMARKING ===
    marketBenchmarking?: {
        comparedToCSStudents: string;
        comparedToInternshipApplicants: string;
        comparedToNewGraduates: string;
        comparedToFAANGApplicants: string;
        reasoning: string;
    };

    // === ENHANCED FAANG READINESS ===
    faangReadiness?: {
        google: { readiness: number; whyScoreAssigned: string; strengths: string[]; weaknesses: string[]; missingSkills: string[]; expectedImprovementIfFixed: string };
        amazon: { readiness: number; whyScoreAssigned: string; strengths: string[]; weaknesses: string[]; missingSkills: string[]; expectedImprovementIfFixed: string };
        microsoft: { readiness: number; whyScoreAssigned: string; strengths: string[]; weaknesses: string[]; missingSkills: string[]; expectedImprovementIfFixed: string };
        meta: { readiness: number; whyScoreAssigned: string; strengths: string[]; weaknesses: string[]; missingSkills: string[]; expectedImprovementIfFixed: string };
    };

    // === INTERVIEW READINESS ===
    interviewReadiness?: {
        dsa: { readiness: number; recommendations: string[] };
        frontend: { readiness: number; recommendations: string[] };
        backend: { readiness: number; recommendations: string[] };
        fullStack: { readiness: number; recommendations: string[] };
        behavioral: { readiness: number; recommendations: string[] };
        systemDesign: { readiness: number; recommendations: string[] };
    };

    // === FAANG-LEVEL PROJECT RECOMMENDATIONS ===
    projectRecommendations?: {
        systemDesign: { title: string; description: string; technologies: string[]; faangCompany: string; systemDesignConcepts: string[]; scalabilityPatterns: string[] }[];
        lowLevelDesign: { title: string; description: string; technologies: string[]; designPatterns: string[]; concurrencyAspects: string[] }[];
        distributedSystems: { title: string; description: string; technologies: string[]; consistencyModels: string[]; failureModes: string[] }[];
    };

    // === ACTIONABLE GAP ANALYSIS ===
    actionableGapAnalysis?: {
        skill: string;
        importance: string;
        resumeImpact: string;
        expectedATSImprovement: number;
        expectedReadinessImprovement: { company: string; improvement: number }[];
    }[];

    // === RESUME BULLET ANALYZER ===
    resumeBulletAnalyzer?: {
        originalBullet: string;
        qualityScore: number;
        weaknesses: string[];
        improvedVersion: string;
        impactImprovement: string;
        recruiterAppealImprovement: string;
    }[];

    // === RESUME COMPARISON (architecture placeholder) ===
    resumeComparison?: {
        scoreChange: number | null;
        newSkillsAdded: string[];
        improvementTrend: string | null;
        atsImprovement: number | null;
    };

    // === PDF ENHANCEMENT: 30/60/90 DAY GROWTH PLAN ===
    growthPlan?: {
        first30Days: { focus: string; actions: string[]; skills: string[]; expectedOutcome: string };
        next60Days: { focus: string; actions: string[]; skills: string[]; expectedOutcome: string };
        next90Days: { focus: string; actions: string[]; skills: string[]; expectedOutcome: string };
    };

    // === PDF ENHANCEMENT: PRIORITY SKILLS TO LEARN ===
    prioritySkills?: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };

    // === PDF ENHANCEMENT: PRIORITY PROJECTS TO BUILD ===
    priorityProjects?: {
        quickWins: { title: string; description: string; impact: string }[];
        portfolioBuilders: { title: string; description: string; impact: string }[];
        faangLevel: { title: string; description: string; impact: string }[];
    };

    // === PDF ENHANCEMENT: ROLE-SPECIFIC IMPROVEMENT ROADMAP ===
    roleSpecificRoadmap?: {
        shortTerm: string[];
        midTerm: string[];
        longTerm: string[];
        expectedTimeline: string;
    };
}

export interface ResumeAnalysisItem {
    id: number;
    resumeText: string;
    jobDescription: string | null;
    analysisData: AnalysisResult;
    resumeName: string | null;
    createdAt: string;
}

// Cover Letter Types
export interface CoverLetterItem {
    id: number;
    jobDescription: string;
    userDetails: string;
    coverLetter: string;
    createdAt: string;
}

// Chat Types
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

export interface ChatItem {
    chatId: string;
    chatTitle: string;
    createdAt: string;
}

// Resume Builder Types
export interface PersonalInfo {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    linkedin?: string;
    github?: string;
    leetcode?: string;
    portfolio?: string;
    summary: string;
}

export interface Education {
    institution: string;
    degree: string;
    location: string;
    startDate: string;
    endDate: string;
    cgpa?: string;
    description?: string;
}

export interface Experience {
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface Skill {
    category: string;
    skills: string[];
}

export interface Project {
    title: string;
    link?: string;
    description: string;
    technologies: string[];
}

export interface CustomSubItem {
    title?: string;
    subtitle?: string;
    date?: string;
    location?: string;
    description: string;
}

export interface CustomSection {
    id: string;
    title: string;
    items: CustomSubItem[];
}

export interface ResumeData {
    personalInfo: PersonalInfo;
    education: Education[];
    experience: Experience[];
    skills: Skill[];
    projects: Project[];
    honors?: string[];
    customSections?: CustomSection[];
    template: string;
}

export interface ResumeItem {
    id: number;
    userEmail: string;
    resumeName: string;
    resumeData: ResumeData;
    createdAt: string;
    updatedAt: string;
}

// Mentorix Profile Types (Database-mapped)
export interface UserProfile {
    id: number;
    userEmail: string;
    name: string | null;
    profilePhoto: string | null;
    currentRole: string | null;
    university: string | null;
    location: string | null;
    internshipsCount: number | null;
    leetcodeCount: number | null;
    completionPercentage: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProfessionalLink {
    id: number;
    userEmail: string;
    platform: string;
    url: string;
}

export interface UserSkill {
    id: number;
    userEmail: string;
    category: string;
    skillName: string;
}

export interface UserProject {
    id: number;
    userEmail: string;
    title: string;
    techStack: string;
    description: string;
    links: string | null;
}

export interface CareerGoal {
    id: number;
    userEmail: string;
    targetRole: string | null;
    preferredDomain: string | null;
    targetCompanies: string | null;
}

export interface ProfileInsight {
    id: number;
    userEmail: string;
    jobReadinessScore: number | null;
    breakdown: string | null;
    atsScore: number | null;
    keywordStrength: string | null;
    projectImpact: string | null;
    suggestions: string | null;
    sectionAnalysis: string | null;
    improvementPlan: string | null;
    updatedAt: Date;
}

export interface UserEducation {
    id: number;
    userEmail: string;
    institution: string;
    degree: string | null;
    fieldOfStudy: string | null;
    cgpa: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
}

export interface UserExperience {
    id: number;
    userEmail: string;
    company: string;
    role: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
}

export interface UserAchievement {
    id: number;
    userEmail: string;
    title: string;
    description: string | null;
}

// Combined Profile Type for API/Components
export interface ProfileWithRelations extends UserProfile {
    links: ProfessionalLink[];
    skills: UserSkill[];
    projects: UserProject[];
    education: UserEducation[];
    experience: UserExperience[];
    achievements: UserAchievement[];
    goals?: CareerGoal | null;
    insights?: ProfileInsight | null;
}
// History & Other Types
export interface WritingDoc {
    id: number;
    userEmail: string;
    docType: string;
    context: string;
    generatedContent: string;
    userDetails: string | null;
    createdAt: Date;
}
