export interface WhyCard {
  title: string;
  description: string;
  icon: any; // LucideIcon
  gradient: string;
}

export const whyMentorix: WhyCard[] = [
  {
    title: "AI‑Powered Career Intelligence",
    description: "Leverage AI to uncover hidden strengths and opportunities.",
    icon: require('lucide-react').Sparkles,
    gradient: "from-indigo-600 to-purple-500",
  },
  {
    title: "ATS‑Friendly Resume Tools",
    description: "Build resumes that pass automated recruiter filters.",
    icon: require('lucide-react').ShieldCheck,
    gradient: "from-green-600 to-teal-500",
  },
  {
    title: "Personalized Learning Roadmaps",
    description: "Tailored skill‑growth plans for your target role.",
    icon: require('lucide-react').Target,
    gradient: "from-rose-600 to-pink-500",
  },
  {
    title: "Professional Writing Assistant",
    description: "Create cover letters, SOPs, and proposals with AI finesse.",
    icon: require('lucide-react').PenTool,
    gradient: "from-blue-600 to-indigo-500",
  },
  {
    title: "Resume Builder",
    description: "Premium templates, live preview, and one‑click PDF export.",
    icon: require('lucide-react').FileText,
    gradient: "from-rose-600 to-pink-500",
  },
  {
    title: "Career Mentor",
    description: "24/7 AI coach for interview prep, salary advice, and more.",
    icon: require('lucide-react').MessageSquare,
    gradient: "from-emerald-600 to-teal-500",
  },
];
