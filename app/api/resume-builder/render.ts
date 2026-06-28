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
    body { font-family: var(--font-family, 'Inter'), sans-serif; margin: 0; padding: 0; position: relative; }
    .resume { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; }
    body::after {
      content: "Mentorix";
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 140px;
      font-weight: 900;
      color: rgba(99, 102, 241, 0.06);
      pointer-events: none;
      z-index: 9999;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      white-space: nowrap;
      font-family: 'Inter', 'Helvetica', sans-serif;
    }
  `;
}
