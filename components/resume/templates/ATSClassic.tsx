// components/resume/templates/ATSClassic.tsx
import type { ResumeJSON } from "@/types/resume";

/**
 * Simple ATS‑Friendly Classic template.
 * Returns a raw HTML string (not a React component) because the server side PDF generator
 * renders the string directly with puppeteer.
 */
export default function ATSClassic({ resume }: { resume: ResumeJSON }): string {
  const { personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages, interests, customSections } = resume;
  const name = personalInfo?.fullName ?? "";
  const role = personalInfo?.role ?? "";
  const contact = `${personalInfo?.email ?? ""} | ${personalInfo?.phone ?? ""} | ${personalInfo?.linkedIn ?? ""} | ${personalInfo?.github ?? ""}`;
  return `
    <div class="resume ats-classic">
      <h1 style="margin:0;">${name}</h1>
      <h2 style="margin:0; font-weight:normal; color:#555;">${role}</h2>
      <p style="margin:5px 0; font-size:0.9em;">${contact}</p>
      ${summary ? `<section><h3>Summary</h3><p>${summary}</p></section>` : ""}
      ${experience && experience.length ? `<section><h3>Experience</h3>${experience.map(item => `
        <div class="item">
          <strong>${item.title ?? ""}</strong> – ${item.company ?? ""}<br/>
          <span style="font-size:0.85em;">${item.startDate ?? ""} – ${item.endDate ?? ""}</span>
          <p>${item.description ?? ""}</p>
        </div>`).join("")}</section>` : ""}
      ${education && education.length ? `<section><h3>Education</h3>${education.map(item => `
        <div class="item">
          <strong>${item.title ?? ""}</strong>, ${item.institution ?? ""}<br/>
          <span style="font-size:0.85em;">${item.startDate ?? ""} – ${item.endDate ?? ""}</span>
        </div>`).join("")}</section>` : ""}
      ${skills && skills.length ? `<section><h3>Skills</h3><p>${skills.join(", ")}</p></section>` : ""}
      ${projects && projects.length ? `<section><h3>Projects</h3>${projects.map(item => `
        <div class="item">
          <strong>${item.title ?? ""}</strong><br/>
          <p>${item.description ?? ""}</p>
        </div>`).join("")}</section>` : ""}
      ${certifications && certifications.length ? `<section><h3>Certifications</h3>${certifications.map(item => `
        <div class="item">
          <strong>${item.title ?? ""}</strong> – ${item.issuer ?? ""}<br/>
          <span style="font-size:0.85em;">${item.date ?? ""}</span>
        </div>`).join("")}</section>` : ""}
      ${achievements && achievements.length ? `<section><h3>Achievements</h3><ul>${achievements.map(item => `<li>${item.title ?? item.description ?? ""}</li>`).join("")}</ul></section>` : ""}
      ${languages && languages.length ? `<section><h3>Languages</h3><p>${languages.join(", ")}</p></section>` : ""}
      ${interests && interests.length ? `<section><h3>Interests</h3><p>${interests.join(", ")}</p></section>` : ""}
      ${customSections && customSections.length ? `<section><h3>Additional Sections</h3>${customSections.map(sec => `
        <div class="item"><h4>${sec.title ?? ""}</h4><p>${sec.description ?? ""}</p></div>`).join("")}</section>` : ""}
    </div>
  `;
}
