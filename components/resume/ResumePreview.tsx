import React from 'react';
import { ResumeData, DEFAULT_SECTION_ORDER, SectionType } from "@/types";
import { Mail, Phone, Linkedin, Github, Trophy, ExternalLink, Award, BookOpen, Globe, BadgeCheck } from "lucide-react";

interface ResumePreviewProps {
    data: ResumeData;
}

// ─── Placeholder Detection ──────────────────────────────────────────────

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^your\s+/i,
  /^untitled\s+/i,
  /^techcorp$/i,
  /^abc\s+company$/i,
  /^xyz\s+university$/i,
  /^certification\s+name$/i,
  /^project\s+name$/i,
  /^institution$/i,
  /^company$/i,
  /^role$/i,
]

function isPlaceholder(val: string | null | undefined): boolean {
  if (!val || val.trim() === "") return true
  return PLACEHOLDER_PATTERNS.some(p => p.test(val.trim()))
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data }) => {
    const { personalInfo, education, experience, skills, projects, certifications, achievements, languages, publications, honors, customSections, sectionOrder } = data;

    const cleanUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

    const hasName = !isPlaceholder(personalInfo.fullName)
    const hasSummary = !isPlaceholder(personalInfo.summary)

    // Sections with no real data should not render
    const realExperience = experience.filter(e => !isPlaceholder(e.company) && !isPlaceholder(e.role))
    const realEducation = education.filter(e => !isPlaceholder(e.institution))
    const realProjects = projects.filter(p => !isPlaceholder(p.title))
    const realSkills = skills.filter(s => s.skills && s.skills.some(sk => !isPlaceholder(sk)))
    const realCertifications = (certifications || []).filter(c => !isPlaceholder(c.title))
    const realAchievements = (achievements || (honors || []).map(h => ({ title: h }))).filter(a => !isPlaceholder(a.title))
    const realLanguages = (languages || []).filter(l => !isPlaceholder(l.name))
    const realPublications = (publications || []).filter(p => !isPlaceholder(p.title))
    const realCustomSections = (customSections || []).map(s => ({
      ...s,
      items: s.items.filter(item => !isPlaceholder(item.title) || !isPlaceholder(item.description))
    })).filter(s => s.items.length > 0)

    // Build section availability map
    const availableSections: { type: SectionType; render: () => React.ReactNode }[] = []

    if (hasSummary) {
      availableSections.push({
        type: "summary",
        render: () => (
          <section className="mb-4" key="summary">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-2 border-b-[1.5px] border-slate-900 pb-1 text-slate-900">Summary</h2>
            <p className="text-[11px] leading-snug text-slate-700 whitespace-pre-wrap">{personalInfo.summary}</p>
          </section>
        ),
      })
    }

    if (realExperience.length > 0) {
      availableSections.push({
        type: "experience",
        render: () => (
          <section className="mb-4" key="experience">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 border-b-[1.5px] border-slate-900 pb-1 text-slate-900">Professional Experience</h2>
            <div className="space-y-4">
              {realExperience.map((exp, idx) => (
                <div key={idx} className={`${idx > 0 ? "pt-3 border-t border-slate-100" : ""}`}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-[11px] font-bold text-slate-900">{exp.role}</h3>
                    <span className="text-[10px] font-bold text-slate-500 italic">{exp.startDate} — {exp.endDate}</span>
                  </div>
                  <h4 className="text-[10px] font-semibold text-slate-700 italic mb-2">{exp.company} {exp.location ? `| ${exp.location}` : ""}</h4>
                  {exp.description && (
                    <div className="space-y-1.5 pl-2">
                      {exp.description.split('\n').filter(p => p.trim()).map((point, pIdx) => (
                        <div key={pIdx} className="flex gap-2.5">
                          <span className="text-[9px] mt-1.5 text-slate-400">•</span>
                          <p className="text-[10px] leading-snug text-slate-700">{point}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ),
      })
    }

    if (realEducation.length > 0) {
      availableSections.push({
        type: "education",
        render: () => (
          <section className="mb-4" key="education">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 border-b-[1.5px] border-slate-900 pb-1 text-slate-900">Education</h2>
            <div className="space-y-3">
              {realEducation.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-[11px] font-bold text-slate-900">{edu.institution}</h3>
                    <span className="text-[10px] font-bold text-slate-500 italic">{edu.startDate} — {edu.endDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-slate-700 italic">{edu.degree}</span>
                    {edu.cgpa && <span className="text-[9px] font-bold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">GPA: {edu.cgpa}</span>}
                  </div>
                  {edu.description && (
                    <p className="text-[10px] text-slate-600 mt-1 leading-snug">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ),
      })
    }

    if (realProjects.length > 0) {
      availableSections.push({
        type: "projects",
        render: () => (
          <section className="mb-4" key="projects">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 border-b-[1.5px] border-slate-900 pb-1 text-slate-900">Strategic Projects</h2>
            <div className="space-y-4">
              {realProjects.map((project, idx) => (
                <div key={idx} className={`${idx > 0 ? "pt-3 border-t border-slate-100" : ""}`}>
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-[11px] font-bold text-slate-900 flex items-center gap-2">
                      {project.title}
                      {project.link && <ExternalLink className="w-3 h-3 text-blue-500" />}
                    </h3>
                    {Array.isArray(project.technologies) && project.technologies.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {project.technologies.map((tech, i) => (
                          <span key={i} className="text-[8px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full font-bold uppercase tracking-tighter border border-slate-100">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {project.description && (
                    <div className="space-y-1.5 pl-2">
                      {project.description.split('\n').filter(p => p.trim()).map((point, pIdx) => (
                        <div key={pIdx} className="flex gap-2.5">
                          <span className="text-[9px] mt-1.5 text-slate-400">•</span>
                          <p className="text-[10px] leading-snug text-slate-700">{point}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ),
      })
    }

    if (realSkills.length > 0) {
      availableSections.push({
        type: "skills",
        render: () => (
          <section className="mb-4" key="skills">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 border-b-[1.5px] border-slate-900 pb-1 text-slate-900">Technical Skills</h2>
            <div className="space-y-2.5">
              {realSkills.map((skill, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="text-[10px] font-bold text-slate-900 w-[45mm] flex-shrink-0">{skill.category}:</span>
                  <span className="text-[10px] text-slate-700 leading-normal">{skill.skills.join(", ")}</span>
                </div>
              ))}
            </div>
          </section>
        ),
      })
    }

    if (realCertifications.length > 0) {
      availableSections.push({
        type: "certifications",
        render: () => (
          <section className="mb-4" key="certifications">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 border-b-[1.5px] border-slate-900 pb-1 text-slate-900 flex items-center gap-2">
              <BadgeCheck className="w-3 h-3 text-blue-600" /> Certifications
            </h2>
            <div className="space-y-3">
              {realCertifications.map((cert, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-900">{cert.title}</span>
                    {(cert.issuer || cert.date) && (
                      <span className="text-[9px] text-slate-500 ml-1">
                        {cert.issuer}{cert.issuer && cert.date ? " · " : ""}{cert.date}
                      </span>
                    )}
                    {cert.description && (
                      <p className="text-[9px] text-slate-600 mt-0.5 leading-snug">{cert.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ),
      })
    }

    if (realAchievements.length > 0) {
      availableSections.push({
        type: "achievements",
        render: () => (
          <section className="mb-4" key="achievements">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 border-b-[1.5px] border-slate-900 pb-1 text-slate-900 flex items-center gap-2">
              <Award className="w-3 h-3 text-orange-500" /> Honors & Awards
            </h2>
            <div className="space-y-2.5">
              {realAchievements.map((ach, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Trophy className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-700 leading-snug">{ach.title}</span>
                    {ach.date && <span className="text-[9px] text-slate-500 ml-1">({ach.date})</span>}
                    {ach.description && (
                      <p className="text-[9px] text-slate-600 mt-0.5 leading-snug">{ach.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ),
      })
    }

    if (realPublications.length > 0) {
      availableSections.push({
        type: "publications",
        render: () => (
          <section className="mb-4" key="publications">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 border-b-[1.5px] border-slate-900 pb-1 text-slate-900 flex items-center gap-2">
              <BookOpen className="w-3 h-3 text-slate-700" /> Publications
            </h2>
            <div className="space-y-3">
              {realPublications.map((pub, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-900">{pub.title}</span>
                    {(pub.publisher || pub.date) && (
                      <span className="text-[9px] text-slate-500 ml-1">
                        {pub.publisher}{pub.publisher && pub.date ? " · " : ""}{pub.date}
                      </span>
                    )}
                    {pub.description && (
                      <p className="text-[9px] text-slate-600 mt-0.5 leading-snug">{pub.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ),
      })
    }

    if (realLanguages.length > 0) {
      availableSections.push({
        type: "languages",
        render: () => (
          <section className="mb-4" key="languages">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 border-b-[1.5px] border-slate-900 pb-1 text-slate-900 flex items-center gap-2">
              <Globe className="w-3 h-3 text-slate-700" /> Languages
            </h2>
            <div className="flex flex-wrap gap-2">
              {realLanguages.map((lang, idx) => (
                <span key={idx} className="text-[10px] px-2.5 py-1 bg-slate-50 text-slate-700 rounded-full border border-slate-200 font-medium">
                  {lang.name}{lang.proficiency ? ` — ${lang.proficiency}` : ""}
                </span>
              ))}
            </div>
          </section>
        ),
      })
    }

    if (realCustomSections.length > 0) {
      availableSections.push({
        type: "customSections",
        render: () => (
          <React.Fragment key="customSections">
            {realCustomSections.map((section, sIdx) => (
              <section key={section.id || sIdx} className="mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 border-b-[1.5px] border-slate-900 pb-1 text-slate-900">{section.title}</h2>
                <div className="space-y-4">
                  {section.items.map((item, iIdx) => (
                    <div key={iIdx}>
                      <div className="flex justify-between items-baseline mb-0.5">
                        {!isPlaceholder(item.title) && <h3 className="text-[11px] font-bold text-slate-900">{item.title}</h3>}
                        {item.date && <span className="text-[10px] font-bold text-slate-500 italic">{item.date}</span>}
                      </div>
                      {(item.subtitle || item.location) && (
                        <div className="flex justify-between items-baseline mb-2">
                          {item.subtitle && <span className="text-[10px] font-semibold text-slate-700 italic">{item.subtitle}</span>}
                          {item.location && <span className="text-[10px] text-slate-500 font-medium">{item.location}</span>}
                        </div>
                      )}
                      {!isPlaceholder(item.description) && (
                        <div className="space-y-1.5 pl-2">
                          {item.description.split('\n').filter(p => p.trim()).map((point, pIdx) => (
                            <div key={pIdx} className="flex gap-2.5">
                              <span className="text-[9px] mt-1.5 text-slate-400">•</span>
                              <p className="text-[10px] leading-snug text-slate-700">{point}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </React.Fragment>
        ),
      })
    }

    // Determine render order from sectionOrder, fall back to default
    const order = (sectionOrder && sectionOrder.length > 0)
      ? sectionOrder
      : DEFAULT_SECTION_ORDER

    // Sort available sections by the specified order
    const sortedSections = order
      .map(type => availableSections.find(s => s.type === type))
      .filter(Boolean) as { type: SectionType; render: () => React.ReactNode }[]

    // Append any sections not in the order list at the end
    const orderedTypes = new Set(order)
    const remaining = availableSections.filter(s => !orderedTypes.has(s.type))
    const allSections = [...sortedSections, ...remaining]

    return (
        <div className="w-full h-full p-4 flex justify-center overflow-auto custom-scrollbar">
            <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl origin-top scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-transform p-[15mm] font-serif">
                {/* Header — only show if there's a name */}
                {hasName && (
                    <header className="text-center mb-6 border-b-[2.5px] border-slate-950 pb-5 font-serif">
                        <h1 className="text-4xl font-black uppercase tracking-tight mb-5 text-slate-950">
                            {personalInfo.fullName}
                        </h1>

                        <div className="flex justify-center items-center gap-3 text-[10px] text-slate-700">
                            {personalInfo.phone && (
                                <div className="flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 fill-slate-700" />
                                    <span>{personalInfo.phone}</span>
                                </div>
                            )}
                            {personalInfo.phone && personalInfo.email && <span className="text-slate-200">|</span>}
                            {personalInfo.email && (
                                <div className="flex items-center gap-1.5">
                                    <Mail className="w-3 h-3 fill-slate-700" />
                                    <span>{personalInfo.email}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center items-center gap-3 text-[10px] text-slate-700 mt-1.5">
                            {!isPlaceholder(personalInfo.linkedin) && (
                                <div className="flex items-center gap-1.5">
                                    <Linkedin className="w-3 h-3 fill-slate-700" />
                                    <span className="hover:underline">{cleanUrl(personalInfo.linkedin!)}</span>
                                </div>
                            )}
                            {!isPlaceholder(personalInfo.linkedin) && !isPlaceholder(personalInfo.github) && <span className="text-slate-200">|</span>}
                            {!isPlaceholder(personalInfo.github) && (
                                <div className="flex items-center gap-1.5">
                                    <Github className="w-3 h-3 fill-slate-700" />
                                    <span className="hover:underline">{cleanUrl(personalInfo.github!)}</span>
                                </div>
                            )}
                        </div>
                    </header>
                )}

                {/* Render sections in specified order */}
                {allSections.map(s => s.render())}
            </div>
        </div>
    );
};

export default ResumePreview;
