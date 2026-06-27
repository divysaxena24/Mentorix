// app/api/resume-builder/render.ts
import type { ResumeJSON } from "@/types/resume";
import ATSClassic from "@/components/resume/templates/ATSClassic";

/**
 * Render a ResumeJSON to an HTML string using the selected template.
 * For now we only support the "ats-classic" template; additional templates can be added later.
 */
export function renderResumeToHTML(resume: ResumeJSON): string {
  const template = resume.template ?? "ats-classic";
  let html = "";
  switch (template) {
    case "ats-classic":
      html = ATSClassic({ resume });
      break;
    // future cases: other templates
    default:
      html = ATSClassic({ resume });
  }
  // Wrap with basic HTML document to ensure proper CSS loading
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${resume.personalInfo?.fullName ?? "Resume"}</title>
        <style>
          ${globalStyles()}
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
}

/** Simple global CSS to make the PDF look decent. */
function globalStyles(): string {
  return `
    body { font-family: var(--font-family, 'Inter'), sans-serif; margin: 0; padding: 0; }
    .resume { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; }
  `;
}
