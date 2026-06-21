"use client"

/**
 * RoadmapForm — Input form for the V3 Roadmap Engine
 *
 * Collects user preferences for roadmap generation:
 * - Target role with quick-select chips (AI roles prioritized)
 * - Career goal, target company, focus areas
 * - Duration, weekly hours, start date, skill level
 *
 * Features:
 * - Company-specific hints (Google, Amazon, Meta, etc.)
 * - V3 Engine badge indicator
 * - Level selector (Beginner/Intermediate/Advanced)
 * - Validates required fields before enabling generation
 *
 * @see RoadmapClient — parent component that manages state
 * @see POST /api/roadmap — V3 engine endpoint
 */

import { Target, Clock, BarChart, Calendar, Building2, Lightbulb, Sparkles, ChevronRight } from "lucide-react"

interface RoadmapFormProps {
    targetRole: string;
    setTargetRole: (val: string) => void;
    careerGoal: string;
    setCareerGoal: (val: string) => void;
    currentLevel: string;
    setCurrentLevel: (val: string) => void;
    weeklyHours: string;
    setWeeklyHours: (val: string) => void;
    duration: string;
    setDuration: (val: string) => void;
    startDate: string;
    setStartDate: (val: string) => void;
    targetCompany: string;
    setTargetCompany: (val: string) => void;
    focusAreas: string;
    setFocusAreas: (val: string) => void;
    onGenerate: () => void;
    loading: boolean;
}

const COMPANIES = ["", "Google", "Amazon", "Meta", "Microsoft", "Netflix", "Uber", "Atlassian"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const TARGET_COMPANY_HINTS: Record<string, string> = {
    "Google": "DSA • System Design • Distributed Systems",
    "Amazon": "Leadership Principles • Scalable Systems • Backend",
    "Meta": "Full-Stack • React • Product Engineering",
    "Microsoft": "System Design • Azure • Enterprise",
    "Netflix": "Microservices • Cloud-Native • Resilience",
    "Uber": "Distributed Systems • Real-Time Data • Scalability",
    "Atlassian": "Dev Tools • API Design • Microservices",
};

const COMMON_ROLES = [
    "AI Engineer", "Generative AI Engineer", "LLM Engineer",
    "Frontend Engineer", "Backend Engineer", "Full Stack Engineer",
    "DevOps Engineer", "Data Scientist", "ML Engineer",
    "Mobile Engineer", "Cloud Engineer"
];

export default function RoadmapForm({
    targetRole,
    setTargetRole,
    careerGoal,
    setCareerGoal,
    currentLevel,
    setCurrentLevel,
    weeklyHours,
    setWeeklyHours,
    duration,
    setDuration,
    startDate,
    setStartDate,
    targetCompany,
    setTargetCompany,
    focusAreas,
    setFocusAreas,
    onGenerate,
    loading,
}: RoadmapFormProps) {
    const isValid = targetRole.trim() && duration && currentLevel && weeklyHours;
    const companyHint = TARGET_COMPANY_HINTS[targetCompany];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left: Main Form */}
            <div className="lg:col-span-3 space-y-8">
                <div className="bg-white/5 rounded-[2.5rem] p-8 shadow-2xl border border-white/10 backdrop-blur-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl -mr-32 -mt-32 rounded-full" />
                    <div className="relative z-10 space-y-6">

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-3 h-3 text-blue-400" /> Target Role
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    placeholder="e.g. AI Engineer, LLM Engineer, Frontend Engineer..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder:text-white/20 shadow-inner text-lg"
                                />
                                <div className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20">
                                    <span className="text-[8px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-widest">
                                        V3 Engine
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_ROLES.filter(r => !targetRole || r.toLowerCase().includes(targetRole.toLowerCase())).slice(0, 6).map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setTargetRole(role)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${targetRole === role
                                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                            : "bg-white/5 text-slate-500 border-white/10 hover:border-white/20 hover:text-white"
                                        }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Career Goal */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Lightbulb className="w-3 h-3 text-yellow-400" /> Career Goal
                            </label>
                            <input
                                type="text"
                                value={careerGoal}
                                onChange={(e) => setCareerGoal(e.target.value)}
                                placeholder="e.g. Get hired as an AI Engineer at a top tech company"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all font-medium placeholder:text-white/20 shadow-inner"
                            />
                        </div>

                        {/* Target Company (included in the same main border) */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-3 h-3 text-purple-400" /> Target Company
                            </label>
                            <input
                                type="text"
                                placeholder="Target Company (optional)"
                                value={targetCompany}
                                onChange={(e) => setTargetCompany(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner font-medium text-lg"
                            />
                            {targetCompany && (
                                <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl mt-2">
                                    <p className="text-[9px] font-bold text-purple-300 uppercase tracking-wider leading-relaxed">{companyHint}</p>
                                </div>
                            )}
                        </div>

                        {/* Focus Areas */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-3 h-3 text-cyan-400" /> Focus Areas
                            </label>
                            <input
                                type="text"
                                value={focusAreas}
                                onChange={(e) => setFocusAreas(e.target.value)}
                                placeholder="e.g. System Design, Azure, Enterprise AI, MLOps"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium placeholder:text-white/20 shadow-inner text-lg"
                            />
                            <p className="text-[9px] text-slate-600 font-medium">Comma-separated areas to prioritize in your roadmap</p>
                        </div>

                        {/* Duration & Weekly Hours */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-emerald-400" /> Duration
                                </label>
                                <input
                                    type="text"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="e.g. 16 Weeks, 6 Months, 1 Year"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium placeholder:text-white/20 shadow-inner text-lg"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-purple-400" /> Weekly Hours
                                </label>
                                <input
                                    type="number"
                                    value={weeklyHours}
                                    onChange={(e) => setWeeklyHours(e.target.value)}
                                    placeholder="e.g. 14"
                                    min="1"
                                    max="168"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium placeholder:text-white/20 shadow-inner text-lg"
                                />
                            </div>
                        </div>

                        {/* Expected Start Date */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-cyan-400" /> Expected Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium shadow-inner"
                            />
                        </div>

                        {/* Current Skill Level */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <BarChart className="w-3 h-3 text-orange-400" /> Current Skill Level
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {LEVELS.map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setCurrentLevel(level)}
                                        className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${currentLevel === level
                                            ? "bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/5"
                                            : "bg-white/5 text-slate-500 border-white/10 hover:border-white/20 hover:text-white"
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-2 space-y-8">
                {/* Generate Button */}
                <button
                    onClick={onGenerate}
                    disabled={!isValid || loading}
                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl group relative overflow-hidden ${isValid && !loading
                        ? "bg-white text-black hover:bg-slate-200"
                        : "bg-white/5 text-slate-600 cursor-not-allowed"
                    }`}
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>Generating Your Roadmap...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>Generate Premium Roadmap</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
