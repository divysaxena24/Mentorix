import { ResumeData } from "@/types";
import { jsPDF } from "jspdf";

export const TEMPLATES = [
    { id: "corporate", name: "Corporate Professional", description: "Standard corporate/academic layout with centered headers and section dividers." },
];

export const downloadResume = (data: ResumeData) => {
    const doc = new jsPDF();
    const { personalInfo, education, experience, skills, projects, honors } = data;

    const renderCorporate = () => {
        let y = 15;
        const margin = 20;
        const width = 170;
        const centerX = 105;

        // 1. Name (Large, Bold, Centered)
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(personalInfo.fullName.toUpperCase(), centerX, y, { align: "center" });
        y += 8;

        // 2. Contact Info (Multi-line or Wrapped, Centered)
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        const cleanUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

        const addLink = (text: string, url: string, x: number, y: number) => {
            doc.text(text, x, y, { align: "center" });
            const textWidth = doc.getTextWidth(text);
            doc.link(x - textWidth / 2, y - 4, textWidth, 5, { url });
        };

        // Line 1
        const line1Items = [
            { text: personalInfo.phone, isLink: false },
            { text: personalInfo.email, isLink: false },
            { text: personalInfo.portfolio ? cleanUrl(personalInfo.portfolio) : "", url: personalInfo.portfolio, isLink: true }
        ].filter(item => item.text);

        let currentX = centerX;
        const line1Text = line1Items.map(i => i.text).join("  |  ");
        doc.text(line1Text, centerX, y, { align: "center" });

        // Manual link placement for line 1
        let accumX = centerX - doc.getTextWidth(line1Text) / 2;
        line1Items.forEach((item, idx) => {
            if (item.isLink && item.url) {
                doc.link(accumX, y - 4, doc.getTextWidth(item.text), 5, { url: item.url.startsWith('http') ? item.url : `https://${item.url}` });
            }
            accumX += doc.getTextWidth(item.text) + (idx < line1Items.length - 1 ? doc.getTextWidth("  |  ") : 0);
        });

        y += 5;

        // Line 2
        const line2Items = [
            { label: "LinkedIn: ", text: personalInfo.linkedin ? cleanUrl(personalInfo.linkedin) : "", url: personalInfo.linkedin },
            { label: "GitHub: ", text: personalInfo.github ? cleanUrl(personalInfo.github) : "", url: personalInfo.github },
            { label: "LeetCode: ", text: personalInfo.leetcode ? cleanUrl(personalInfo.leetcode) : "", url: personalInfo.leetcode }
        ].filter(item => item.text);

        if (line2Items.length > 0) {
            const line2Text = line2Items.map(i => `${i.label}${i.text}`).join("  |  ");
            doc.text(line2Text, centerX, y, { align: "center" });

            let accumX2 = centerX - doc.getTextWidth(line2Text) / 2;
            line2Items.forEach((item, idx) => {
                if (item.url) {
                    const labelWidth = doc.getTextWidth(item.label);
                    const valWidth = doc.getTextWidth(item.text);
                    doc.link(accumX2 + labelWidth, y - 4, valWidth, 5, { url: item.url.startsWith('http') ? item.url : `https://${item.url}` });
                }
                accumX2 += doc.getTextWidth(`${item.label}${item.text}`) + (idx < line2Items.length - 1 ? doc.getTextWidth("  |  ") : 0);
            });
            y += 5;
        }
        y += 5;

        // Section Helper
        const sectionHeader = (title: string) => {
            if (y > 270) { doc.addPage(); y = 20; }
            y += 5;
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(title.toUpperCase(), margin, y);
            y += 2;
            doc.setLineWidth(0.2);
            doc.line(margin, y, margin + width, y);
            y += 6;
        };

        // 3. Summary
        if (personalInfo.summary) {
            sectionHeader("Summary");
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const summaryLines = doc.splitTextToSize(personalInfo.summary, width);
            doc.text(summaryLines, margin, y);
            y += (summaryLines.length * 5) + 5;
        }

        // 4. Experience
        if (experience.length > 0) {
            sectionHeader("Experience");
            experience.forEach((exp) => {
                if (y > 260) { doc.addPage(); y = 20; }

                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(exp.role, margin, y);
                doc.setFont("helvetica", "normal");
                doc.text(`${exp.startDate} - ${exp.endDate}`, margin + width, y, { align: "right" });
                y += 5;

                doc.setFont("helvetica", "italic");
                doc.text(exp.company, margin, y);
                doc.setFont("helvetica", "normal");
                doc.text(exp.location || "Remote", margin + width, y, { align: "right" });
                y += 6;

                const descLines = doc.splitTextToSize(exp.description, width - 5);
                descLines.forEach((line: string) => {
                    if (y > 280) { doc.addPage(); y = 20; }
                    doc.text("• " + line, margin + 2, y);
                    y += 5;
                });
                y += 2;
            });
        }

        // 5. Projects
        if (projects.length > 0) {
            sectionHeader("Projects");
            projects.forEach((project) => {
                if (y > 260) { doc.addPage(); y = 20; }

                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(project.title, margin, y);

                if (project.link) {
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(0, 0, 255); // Blue for links
                    const linkText = "| Link";
                    doc.text(linkText, margin + doc.getTextWidth(project.title) + 5, y);
                    doc.link(margin + doc.getTextWidth(project.title) + 5 + doc.getTextWidth("| "), y - 4, doc.getTextWidth("Link"), 5, { url: project.link.startsWith('http') ? project.link : `https://${project.link}` });
                    doc.setTextColor(0, 0, 0); // Reset to black
                }
                y += 5;

                const descLines = doc.splitTextToSize(project.description, width - 5);
                descLines.forEach((line: string) => {
                    if (y > 280) { doc.addPage(); y = 20; }
                    doc.text("• " + line, margin + 2, y);
                    y += 5;
                });
                y += 2;
            });
        }

        // 6. Education
        if (education.length > 0) {
            sectionHeader("Education");
            education.forEach((edu) => {
                if (y > 270) { doc.addPage(); y = 20; }

                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(edu.institution, margin, y);
                doc.setFont("helvetica", "normal");
                doc.text(`${edu.startDate} - ${edu.endDate}`, margin + width, y, { align: "right" });
                y += 5;

                doc.setFont("helvetica", "italic");
                doc.text(edu.degree, margin, y);
                doc.setFont("helvetica", "normal");
                doc.text(edu.location, margin + width, y, { align: "right" });
                y += 5;

                if (edu.cgpa) {
                    doc.setFont("helvetica", "bold");
                    doc.text(`• CGPA: ${edu.cgpa}`, margin + 2, y);
                    y += 6;
                } else {
                    y += 2;
                }
            });
        }

        // 7. Skills
        if (skills.length > 0) {
            sectionHeader("Skills");
            skills.forEach((skill) => {
                if (y > 275) { doc.addPage(); y = 20; }
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(`${skill.category}: `, margin, y);

                doc.setFont("helvetica", "normal");
                const skillsText = skill.skills.join(", ");
                const skillLines = doc.splitTextToSize(skillsText, width - doc.getTextWidth(`${skill.category}: `) - 5);
                doc.text(skillLines, margin + doc.getTextWidth(`${skill.category}: `) + 2, y);
                y += (skillLines.length * 5) + 2;
            });
        }

        // 8. Honors & Awards
        if (honors && honors.length > 0) {
            sectionHeader("Honors & Awards");
            honors.forEach((honor) => {
                if (!honor) return;
                if (y > 280) { doc.addPage(); y = 20; }
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const honorLines = doc.splitTextToSize(honor, width - 5);
                honorLines.forEach((line: string, idx: number) => {
                    doc.text(idx === 0 ? "• " + line : "  " + line, margin + 2, y);
                    y += 5;
                });
                y += 1;
            });
        }
    };

    renderCorporate();
    doc.save(`${personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
};
