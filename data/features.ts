import { FileText, FileSearch, PenTool, Map, MessageSquare } from 'lucide-react';

export interface Feature {
  title: string;
  description: string;
  icon: typeof FileText; // any Lucide icon component
  href: string;
  gradient: string; // Tailwind gradient classes
  tag: string;
  capabilities: string[];
  ctaText: string;
}

export const features: Feature[] = [
  {
    title: "Resume Builder",
    description: "Create professional, ATS‑friendly resumes using premium templates and AI assistance.",
    icon: FileText,
    href: "/ai-tools/resume-builder",
    gradient: "from-rose-600 to-pink-500",
    tag: "New Feature",
    capabilities: ["Premium Templates", "Multi‑step Builder", "Instant PDF Export", "Live Preview", "Version History"],
    ctaText: "Open Workspace →",
  },
  {
    title: "Resume Analyzer",
    description: "Get recruiter‑grade feedback with ATS scoring, keyword optimization, and personalized improvement suggestions.",
    icon: FileSearch,
    href: "/ai-tools/resume-analyzer",
    gradient: "from-blue-600 to-cyan-500",
    tag: "Career Intelligence",
    capabilities: ["ATS Score", "Skill Gap Detection", "Recruiter Feedback", "AI Suggestions"],
    ctaText: "Open Workspace →",
  },
  {
    title: "AI Writing Studio",
    description: "Generate professional cover letters, SOPs, letters of recommendation, and business proposals tailored to every opportunity.",
    icon: PenTool,
    href: "/ai-tools/writing-studio",
    gradient: "from-blue-600 to-indigo-500",
    tag: "Job Ready",
    capabilities: ["Cover Letters", "SOP", "LOR", "Proposal Generator", "AI Writing Actions"],
    ctaText: "Open Workspace →",
  },
  {
    title: "Career Roadmaps",
    description: "Generate personalized learning roadmaps based on your current skills, target role, and available learning time.",
    icon: Map,
    href: "/ai-tools/roadmap",
    gradient: "from-purple-600 to-pink-500",
    tag: "Career Growth",
    capabilities: ["AI Learning Plan", "Milestones", "Skill Tracking", "Resource Recommendations"],
    ctaText: "Open Workspace →",
  },
  {
    title: "Career AI Chat",
    description: "Your personal AI career coach for resume reviews, interview preparation, salary discussions, company research, and career guidance.",
    icon: MessageSquare,
    href: "/ai-tools/ai-chat",
    gradient: "from-emerald-600 to-teal-500",
    tag: "AI Coach",
    capabilities: ["Interview Preparation", "Resume Review", "Career Advice", "Salary Insights", "Company Research"],
    ctaText: "Open Workspace →",
  },
];
