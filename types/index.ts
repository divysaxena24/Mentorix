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
 * Supports both V1 (legacy) and V2 (enhanced) formats.
 */
export interface PremiumMilestone {
    weekNumber: number;
    dateRange: string;
    // V1 fields (legacy)
    milestoneTitle?: string;
    objective?: string;
    difficulty: string;
    estimatedHours: number;
    learningFocus?: string[];
    actionableTasks?: string[];
    buildThisWeek?: string;
    resources?: WeeklyResources;
    expectedOutcome?: string[];
    resumeImpact?: "Low" | "Medium" | "High" | "Very High";
    interviewTopicsCovered?: string[];
    projectMapping?: {
        resumeValue: string;
        companyRelevance: string;
        interviewRelevance: string;
        enterpriseImpact: string;
    };
    // V2 fields
    theme?: string;
    learningGoals?: string[];
    skillsCovered?: string[];
    projectToBuild?: {
        name: string;
        objective: string;
        techStack: string[];
        difficulty: string;
        resumeValue: string;
        interviewTopics: string[];
        expectedOutcome: string;
    };
    interviewTopics?: string[];
    expectedDeliverable?: string;
}

/**
 * Checkpoint assessment every 4 weeks.
 * Supports both V1 (legacy) and V2 (enhanced) formats.
 */
export interface Checkpoint {
    weekNumber: number;
    // V1 fields (legacy)
    title?: string;
    quiz?: string[];
    miniProject?: string;
    skillValidation?: string[];
    progressReview?: string;
    // V2 fields
    assessment?: string;
    skillReview?: string[];
    portfolioReview?: string;
    resumeReview?: string;
    mockInterview?: string;
    gapAnalysis?: string[];
    roadmapAdjustment?: string;
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
 * Supports both V1 (legacy) and V2 (enhanced) formats.
 */
export interface FinalSummary {
    // V1 fields (legacy)
    skillsGained?: string[];
    projectsBuilt?: string[];
    interviewAreasCovered?: string[];
    resumeImprovements?: string[];
    expectedReadinessScore?: number;
    readinessTarget?: string;
    // V2 fields — Company Readiness
    companyReadinessScore?: number;
    roleReadinessScore?: number;
    interviewReadinessScore?: number;
    portfolioStrength?: string;
    atsReadiness?: number;
    topStrengths?: string[];
    topWeaknesses?: string[];
    criticalMissingSkills?: string[];
    estimatedHiringProbability?: string;
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
    // V2 fields
    finalCapstone?: {
        projectName: string;
        objective: string;
        techStack: string[];
        expectedOutcome: string;
    };
    projectProgression?: {
        weekStart: number;
        weekEnd: number;
        progressionArc: string;
    }[];
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

// Resume Analysis Types — 5-Section FAANG-Grade Design
export interface AnalysisResult {
  // Overall Score (25% Skills + 30% Projects + 25% Experience + 10% ATS + 10% Company Readiness)
  overallScore: number;

  // ===== Section 1: Skills Score =====
  // Formula: Technical Skills Depth 40% + Breadth 20% + Industry Relevance 20% + Core CS Fundamentals 20%
  skillsScore: number;
  strongSkills: string[];
  missingSkills: string[];
  criticalMissingSkills: string[];
  skillsRecruiterVerdict: string;

  // ===== Section 2: Project Analysis =====
  // Per-project formula: Technical Depth 30% + Industry Relevance 25% + Scalability 20% + Innovation 15% + Resume Value 10%
  projects: {
    projectName: string;
    technologies: string[];
    projectScore: number;
    technicalDepth: number;
    scalability: number;
    industryRelevance: number;
    innovation: number;
    resumeValue: number;
    strength: string;
    improvement: string;
    recruiterVerdict: string;
  }[];

  // ===== Section 3: Experience Analysis =====
  // Per-experience formula: Technical Depth 40% + Role Relevance 25% + Impact 20% + Industry Exposure 15%
  experiences: {
    role: string;
    company: string;
    duration: string;
    experienceScore: number;
    technicalDepth: number;
    businessImpact: number;
    roleRelevance: number;
    industryExposure: number;
    strength: string;
    improvement: string;
    recruiterVerdict: string;
  }[];

  // ===== Section 4: ATS Score =====
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  criticalMissingKeywords: string[];
  expectedATSImprovement: string;

  // ===== Section 5: Company Readiness =====
  // Dynamic based on target company/role/JD
  companyReadinessScore: number;
  companyReadinessAreas: { area: string; score: number }[];
  companyReadinessStrengths: string[];
  companyReadinessWeaknesses: string[];
  companyReadinessMissingSkills: string[];
  interviewProbability: string;
  companyReadinessVerdict: string;

  // ===== Target Role (set by the analyzer) =====
  targetRole?: string;

  // ===== PDF Detailed Report (not shown on website) =====
  recruiterReport: string;

  // Legacy backward compat — kept for history items
  score?: number;
  strengths?: string[];
  criticalGaps?: string[];
  improvementPoints?: string[];
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
