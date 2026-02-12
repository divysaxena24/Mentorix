import React from 'react';
import { ResumeData } from "@/types";
import { Mail, Phone, MapPin, Linkedin, Github, Globe, Trophy, ExternalLink } from "lucide-react";

interface ResumePreviewProps {
    data: ResumeData;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data }) => {
    const { personalInfo, education, experience, skills, projects, honors } = data;

    const cleanUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

    return (
        <div className="w-full h-full p-4 flex justify-center overflow-auto custom-scrollbar">
            <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl origin-top scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-transform p-[20mm] font-serif">
                {/* Header */}
                <header className="text-center mb-10 border-b-2 border-slate-900 pb-8">
                    <h1 className="text-4xl font-black uppercase tracking-tight mb-4 text-slate-950">
                        {personalInfo.fullName || "Your Full Name"}
                    </h1>

                    <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[10px] sm:text-xs font-medium text-slate-600">
                        {personalInfo.phone && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3" />
                                <span>{personalInfo.phone}</span>
                            </div>
                        )}
                        {personalInfo.email && (
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3" />
                                <span>{personalInfo.email}</span>
                            </div>
                        )}
                        {personalInfo.address && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                <span>{personalInfo.address}</span>
                            </div>
                        )}
                        {personalInfo.portfolio && (
                            <div className="flex items-center gap-1.5">
                                <Globe className="w-3 h-3" />
                                <span className="text-blue-600">{cleanUrl(personalInfo.portfolio)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[10px] sm:text-xs font-medium text-slate-600 mt-2">
                        {personalInfo.linkedin && (
                            <div className="flex items-center gap-1.5">
                                <Linkedin className="w-3 h-3" />
                                <span className="text-blue-600">{cleanUrl(personalInfo.linkedin)}</span>
                            </div>
                        )}
                        {personalInfo.github && (
                            <div className="flex items-center gap-1.5">
                                <Github className="w-3 h-3" />
                                <span className="text-blue-600">{cleanUrl(personalInfo.github)}</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Summary */}
                {personalInfo.summary && (
                    <section className="mb-8">
                        <h2 className="text-sm font-black uppercase tracking-widest mb-3 border-b border-slate-200 pb-1 text-slate-900">Summary</h2>
                        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                            {personalInfo.summary}
                        </p>
                    </section>
                )}

                {/* Experience */}
                {experience.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-sm font-black uppercase tracking-widest mb-4 border-b border-slate-200 pb-1 text-slate-900">Professional Experience</h2>
                        <div className="space-y-6">
                            {experience.map((exp, idx) => (
                                <div key={idx} className="relative">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-sm font-bold text-slate-900">{exp.role || "Role"}</h3>
                                        <span className="text-[10px] font-bold text-slate-500 italic">{exp.startDate} — {exp.endDate}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline mb-3">
                                        <span className="text-xs font-semibold text-slate-700 italic">{exp.company || "Company"}</span>
                                        <span className="text-[10px] text-slate-500 font-medium">{exp.location}</span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap pl-2 border-l-2 border-slate-100 italic">
                                        {exp.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects */}
                {projects.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-sm font-black uppercase tracking-widest mb-4 border-b border-slate-200 pb-1 text-slate-900">Strategic Projects</h2>
                        <div className="space-y-6">
                            {projects.map((project, idx) => (
                                <div key={idx} className="relative">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            {project.title || "Untitled Project"}
                                            {project.link && <ExternalLink className="w-3 h-3 text-blue-500" />}
                                        </h3>
                                        {project.technologies && project.technologies.length > 0 && (
                                            <div className="flex gap-1.5">
                                                {project.technologies.map((tech, i) => (
                                                    <span key={i} className="text-[8px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold uppercase tracking-tighter self-center">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap pl-2 border-l-2 border-slate-100 italic">
                                        {project.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {education.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-sm font-black uppercase tracking-widest mb-4 border-b border-slate-200 pb-1 text-slate-900">Education</h2>
                        <div className="space-y-4">
                            {education.map((edu, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-sm font-bold text-slate-900">{edu.institution || "Institution"}</h3>
                                        <span className="text-[10px] font-bold text-slate-500 italic">{edu.startDate} — {edu.endDate}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-xs font-medium text-slate-700 italic">{edu.degree}</span>
                                        {edu.cgpa && <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">GPA: {edu.cgpa}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-sm font-black uppercase tracking-widest mb-3 border-b border-slate-200 pb-1 text-slate-900">Technical Skills</h2>
                        <div className="space-y-2">
                            {skills.map((skill, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <span className="text-xs font-bold text-slate-900 min-w-[120px]">{skill.category}:</span>
                                    <span className="text-xs text-slate-700">{skill.skills.join(", ")}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Honors */}
                {honors && honors.length > 0 && honors.some(h => h) && (
                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest mb-3 border-b border-slate-200 pb-1 text-slate-900">Honors & Awards</h2>
                        <div className="space-y-2">
                            {honors.filter(h => h).map((honor, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <Trophy className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs text-slate-700 leading-snug">{honor}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default ResumePreview;
