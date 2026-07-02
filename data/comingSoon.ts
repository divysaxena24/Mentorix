export interface ComingSoonItem {
  title: string;
  icon: any; // LucideIcon
  gradient: string;
}

export const comingSoon: ComingSoonItem[] = [
  { title: "Mock Interview", icon: require('lucide-react').Zap, gradient: "from-indigo-600 to-purple-500" },
  { title: "LinkedIn Optimizer", icon: require('lucide-react').Sparkles, gradient: "from-blue-600 to-cyan-500" },
  { title: "Portfolio Analyzer", icon: require('lucide-react').ShieldCheck, gradient: "from-green-600 to-teal-500" },
  { title: "Job Tracker", icon: require('lucide-react').Target, gradient: "from-rose-600 to-pink-500" },
  { title: "Behavioral Interview Coach", icon: require('lucide-react').MessageSquare, gradient: "from-emerald-600 to-teal-500" },
  { title: "Company Research", icon: require('lucide-react').Map, gradient: "from-purple-600 to-pink-500" },
];
