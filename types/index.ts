// Roadmap Types
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

// Resume Analysis Types
export interface AnalysisResult {
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
export interface UserCourse {
    id: number;
    userEmail: string;
    title: string;
    description: string;
    targetField: string | null;
    roadmapData: any;
    createdAt: Date;
}

export interface WritingDoc {
    id: number;
    userEmail: string;
    docType: string;
    context: string;
    generatedContent: string;
    userDetails: string | null;
    createdAt: Date;
}
