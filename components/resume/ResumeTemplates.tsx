import { ResumeData, DEFAULT_SECTION_ORDER, SectionType } from "@/types";
import { jsPDF } from "jspdf";

export const TEMPLATES = [
    { id: "corporate", name: "Corporate Professional", description: "Standard corporate/academic layout with centered headers and section dividers." },
];

export const downloadResume = (data: ResumeData) => {
    const doc = new jsPDF();
    const { personalInfo, education, experience, skills, projects, certifications, achievements, languages, publications, honors, customSections, sectionOrder } = data;

    const cleanUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

    const renderCorporate = () => {
        let y = 15;
        const margin = 15;
        const width = 180;
        const centerX = 105;

        // 1. Name
        doc.setFontSize(24);
        doc.setFont("times", "bold");
        doc.setTextColor(0, 31, 63);
        doc.text(personalInfo.fullName.toUpperCase(), centerX, y, { align: "center" });
        doc.setTextColor(0, 0, 0);
        y += 10;

        // 2. Contact Info
        doc.setFont("times", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);

        const drawIcon = (type: string, x: number, y: number) => {
            doc.setLineWidth(0.1);
            const iconSize = 2.8;
            const offset = 0.4;
            doc.setDrawColor(80, 80, 80);
            doc.setFillColor(80, 80, 80);

            if (type === "phone") {
                doc.roundedRect(x, y - iconSize + offset, 1.8, iconSize, 0.4, 0.4, "FD");
                doc.setFillColor(255, 255, 255);
                doc.circle(x + 0.9, y - 0.4 + offset, 0.25, "F");
            } else if (type === "email") {
                doc.rect(x, y - 2.5 + offset, 3.8, 2.5, "FD");
                doc.setDrawColor(255, 255, 255);
                doc.setLineWidth(0.15);
                doc.line(x, y - 2.5 + offset, x + 1.9, y - 1.25 + offset);
                doc.line(x + 1.9, y - 1.25 + offset, x + 3.8, y - 2.5 + offset);
            } else if (type === "linkedin") {
                doc.roundedRect(x, y - 2.8 + offset, 3.0, 3.0, 0.4, 0.4, "FD");
                doc.setFillColor(255, 255, 255);
                doc.rect(x + 0.6, y - 1.5 + offset, 0.4, 1.0, "F");
                doc.circle(x + 0.8, y - 1.9 + offset, 0.2, "F");
                doc.rect(x + 1.2, y - 1.5 + offset, 0.4, 1.0, "F");
                doc.roundedRect(x + 1.2, y - 1.55 + offset, 1.2, 0.6, 0.3, 0.3, "F");
                doc.rect(x + 1.9, y - 1.5 + offset, 0.4, 1.0, "F");
            } else if (type === "github") {
                doc.circle(x + 1.6, y - 1.5 + offset, 1.4, "FD");
                doc.triangle(x + 0.5, y - 2.2 + offset, x + 0.8, y - 3.2 + offset, x + 1.2, y - 2.6 + offset, "FD");
                doc.triangle(x + 2.7, y - 2.2 + offset, x + 2.4, y - 3.2 + offset, x + 2.0, y - 2.6 + offset, "FD");
            }
        };

        // Phone & Email
        let line1 = "";
        if (personalInfo.phone) line1 += `      ${personalInfo.phone}`;
        if (personalInfo.email) line1 += `${line1 ? "    |    " : ""}      ${personalInfo.email}`;

        if (line1.includes("|")) {
            const separatorX = centerX + (doc.getTextWidth(`      ${personalInfo.phone} `) - (doc.getTextWidth(line1) / 2));
            doc.setDrawColor(210, 210, 210);
            doc.setLineWidth(0.05);
            doc.line(separatorX + 4.5, y - 3, separatorX + 4.5, y + 0.5);
        }

        doc.setTextColor(60, 60, 60);
        doc.text(line1, centerX, y, { align: "center" });

        const l1W = doc.getTextWidth(line1);
        let l1StartX = centerX - (l1W / 2);
        if (personalInfo.phone) {
            drawIcon("phone", l1StartX, y);
            l1StartX += doc.getTextWidth(`      ${personalInfo.phone}`) + (personalInfo.email ? doc.getTextWidth("    |    ") : 0);
        }
        if (personalInfo.email) {
            drawIcon("email", l1StartX, y);
        }
        y += 5;

        // Links
        let line2 = "";
        if (personalInfo.linkedin) line2 += `      ${cleanUrl(personalInfo.linkedin)}`;
        if (personalInfo.github) line2 += `${line2 ? "    |    " : ""}      ${cleanUrl(personalInfo.github)}`;

        if (line2) {
            if (line2.includes("|")) {
                const separatorX = centerX + (doc.getTextWidth(`      ${cleanUrl(personalInfo.linkedin || "")} `) - (doc.getTextWidth(line2) / 2));
                doc.setDrawColor(210, 210, 210);
                doc.setLineWidth(0.05);
                doc.line(separatorX + 4.5, y - 3, separatorX + 4.5, y + 0.5);
            }

            doc.setTextColor(0, 102, 204);
            doc.text(line2, centerX, y, { align: "center" });

            let l2W = doc.getTextWidth(line2);
            let l2StartX = centerX - (l2W / 2);

            if (personalInfo.linkedin) {
                const linkW = doc.getTextWidth(`      ${cleanUrl(personalInfo.linkedin || "")}`);
                drawIcon("linkedin", l2StartX, y);
                doc.link(l2StartX + 4, y - 3, linkW - 4, 4, { url: (personalInfo.linkedin || "").startsWith('http') ? (personalInfo.linkedin || "") : `https://${personalInfo.linkedin}` });
                l2StartX += linkW + (personalInfo.github ? doc.getTextWidth("    |    ") : 0);
            }
            if (personalInfo.github) {
                const linkW = doc.getTextWidth(`      ${cleanUrl(personalInfo.github || "")}`);
                drawIcon("github", l2StartX, y);
                doc.link(l2StartX + 4, y - 3, linkW - 4, 4, { url: (personalInfo.github || "").startsWith('http') ? (personalInfo.github || "") : `https://${personalInfo.github}` });
            }
            doc.setTextColor(0, 0, 0);
            y += 4;
        }
        y += 5;

        // Section Helper
        const sectionHeader = (title: string) => {
            if (y > 270) { doc.addPage(); y = 20; }
            y += 4;
            doc.setFontSize(10.5);
            doc.setFont("helvetica", "bold");
            doc.text(title.toUpperCase(), margin, y);
            y += 1.5;
            doc.setLineWidth(0.4);
            doc.setDrawColor(0, 0, 0);
            doc.line(margin, y, margin + width, y);
            y += 6;
        };

        // ── Determine section render order ──────────────────────────────
        const order = (sectionOrder && sectionOrder.length > 0) ? sectionOrder : DEFAULT_SECTION_ORDER;

        const renderers: Record<string, () => void> = {
            summary: () => {
                if (!personalInfo.summary) return;
                sectionHeader("Summary");
                doc.setFontSize(9.5);
                doc.setFont("helvetica", "normal");
                const summaryLines = doc.splitTextToSize(personalInfo.summary, width);
                doc.text(summaryLines, margin, y);
                y += (summaryLines.length * 4.5) + 3;
            },
            experience: () => {
                if (experience.length === 0) return;
                sectionHeader("Professional Experience");
                experience.forEach((exp, idx) => {
                    if (y > 250) { doc.addPage(); y = 20; }
                    if (idx > 0) { doc.setDrawColor(240, 240, 240); doc.setLineWidth(0.1); doc.line(margin, y - 2, margin + width, y - 2); y += 2; }
                    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text(exp.role, margin, y);
                    doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); doc.text(`${exp.startDate} - ${exp.endDate}`, margin + width, y, { align: "right" });
                    y += 4.5;
                    doc.setFontSize(9.5); doc.setFont("helvetica", "italic"); doc.text(exp.company + (exp.location ? ` | ${exp.location}` : ""), margin, y);
                    y += 5.5;
                    const descPoints = exp.description.split('\n').filter(p => p.trim() !== "");
                    descPoints.forEach((point) => {
                        const descLines = doc.splitTextToSize(point, width - 6);
                        descLines.forEach((line: string, lIdx: number) => {
                            if (y > 280) { doc.addPage(); y = 20; }
                            doc.setFont("helvetica", "normal"); doc.setFontSize(9);
                            doc.text(lIdx === 0 ? "\u2022  " + line : "   " + line, margin + 2, y);
                            y += 4;
                        });
                    });
                    y += 2;
                });
            },
            education: () => {
                if (education.length === 0) return;
                sectionHeader("Education");
                education.forEach((edu, idx) => {
                    if (y > 260) { doc.addPage(); y = 20; }
                    if (idx > 0) { doc.setDrawColor(240, 240, 240); doc.setLineWidth(0.1); doc.line(margin, y - 2, margin + width, y - 2); y += 2; }
                    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text(edu.institution, margin, y);
                    doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); doc.text(`${edu.startDate} - ${edu.endDate}`, margin + width, y, { align: "right" });
                    y += 4.5;
                    doc.setFontSize(9.5); doc.setFont("helvetica", "italic"); doc.text(edu.degree, margin, y);
                    if (edu.cgpa) {
                        doc.setFontSize(8); const gpaText = `GPA: ${edu.cgpa}`; const gpaW = doc.getTextWidth(gpaText) + 4;
                        doc.setDrawColor(220, 220, 220); doc.setFillColor(248, 248, 248);
                        doc.roundedRect(margin + width - gpaW, y - 3.5, gpaW, 5, 2, 2, "FD");
                        doc.setFont("helvetica", "bold"); doc.text(gpaText, margin + width - gpaW + 2, y);
                    }
                    y += 6;
                });
            },
            projects: () => {
                if (projects.length === 0) return;
                sectionHeader("Strategic Projects");
                projects.forEach((proj, idx) => {
                    if (y > 250) { doc.addPage(); y = 20; }
                    if (idx > 0) { doc.setDrawColor(240, 240, 240); doc.setLineWidth(0.1); doc.line(margin, y - 2, margin + width, y - 2); y += 2; }
                    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text(proj.title, margin, y);
                    if (proj.link) {
                        const titleW = doc.getTextWidth(proj.title); const iconX = margin + titleW + 2;
                        doc.setDrawColor(0, 102, 204); doc.rect(iconX, y - 3, 2.5, 2.5);
                        doc.line(iconX + 1.5, y - 3, iconX + 3, y - 4.5); doc.line(iconX + 2, y - 4.5, iconX + 3, y - 4.5); doc.line(iconX + 3, y - 4.5, iconX + 3, y - 3.5);
                        doc.link(iconX, y - 4.5, 3.5, 4, { url: proj.link.startsWith('http') ? proj.link : `https://${proj.link}` });
                    }
                    if (proj.technologies && proj.technologies.length > 0) {
                        doc.setFontSize(7); doc.setFont("helvetica", "bold");
                        let tagX = margin + width;
                        [...proj.technologies].reverse().forEach(tag => {
                            const tagW = doc.getTextWidth(tag.toUpperCase()) + 4; tagX -= tagW;
                            doc.setDrawColor(220, 220, 220); doc.setFillColor(245, 245, 245);
                            doc.roundedRect(tagX, y - 3, tagW - 1, 4.5, 1, 1, "FD");
                            doc.setTextColor(100, 100, 100); doc.text(tag.toUpperCase(), tagX + 2, y + 0.5);
                            tagX -= 2;
                        });
                        doc.setTextColor(0, 0, 0);
                    }
                    y += 5.5;
                    const descPoints = proj.description.split('\n').filter(p => p.trim() !== "");
                    descPoints.forEach((point) => {
                        const descLines = doc.splitTextToSize(point, width - 6);
                        descLines.forEach((line: string, lIdx: number) => {
                            if (y > 280) { doc.addPage(); y = 20; }
                            doc.setFont("helvetica", "normal"); doc.setFontSize(9);
                            doc.text(lIdx === 0 ? "\u2022  " + line : "   " + line, margin + 2, y);
                            y += 4;
                        });
                    });
                    y += 2;
                });
            },
            skills: () => {
                if (skills.length === 0) return;
                sectionHeader("Technical Skills");
                const colX = margin + 45;
                skills.forEach((skill) => {
                    if (y > 275) { doc.addPage(); y = 20; }
                    doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.text(`${skill.category}:`, margin, y);
                    doc.setFont("helvetica", "normal");
                    const skillLines = doc.splitTextToSize(skill.skills.join(", "), width - (colX - margin));
                    doc.text(skillLines, colX, y);
                    y += (skillLines.length * 4.5) + 1.5;
                });
            },
            certifications: () => {
                const certs = certifications || [];
                if (certs.length === 0) return;
                sectionHeader("Certifications");
                certs.forEach((cert) => {
                    if (y > 275) { doc.addPage(); y = 20; }
                    doc.setFontSize(9.5); doc.setFont("helvetica", "bold");
                    doc.text(cert.title, margin, y);
                    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
                    doc.setTextColor(100, 100, 100);
                    const certDetail = [cert.issuer, cert.date].filter(Boolean).join(" \u00b7 ");
                    if (certDetail) doc.text(certDetail, margin + 3, y);
                    doc.setTextColor(0, 0, 0);
                    y += 5;
                });
            },
            achievements: () => {
                const achs = achievements || (honors || []).map(h => ({ title: h }));
                if (!achs || achs.length === 0) return;
                sectionHeader("Honors & Awards");
                achs.forEach((ach) => {
                    if (!ach) return;
                    if (y > 275) { doc.addPage(); y = 20; }
                    doc.setDrawColor(255, 140, 0); doc.setFillColor(255, 165, 0); doc.setLineWidth(0.3);
                    doc.ellipse(margin + 2.5, y - 3, 1.2, 1.5, "FD");
                    doc.line(margin + 1.2, y - 3, margin + 0.8, y - 3.5); doc.line(margin + 0.8, y - 3.5, margin + 1.2, y - 4);
                    doc.line(margin + 3.8, y - 3, margin + 4.2, y - 3.5); doc.line(margin + 4.2, y - 3.5, margin + 3.8, y - 4);
                    doc.line(margin + 2.5, y - 1.5, margin + 2.5, y - 0.5); doc.line(margin + 1.5, y - 0.5, margin + 3.5, y - 0.5);
                    doc.setFontSize(9); doc.setFont("helvetica", "normal");
                    const title = ach.title + (ach.date ? ` (${ach.date})` : "");
                    const honorLines = doc.splitTextToSize(title, width - 8);
                    doc.text(honorLines, margin + 7, y);
                    y += (honorLines.length * 4.5) + 1.5;
                });
            },
            publications: () => {
                const pubs = publications || [];
                if (pubs.length === 0) return;
                sectionHeader("Publications");
                pubs.forEach((pub) => {
                    if (y > 275) { doc.addPage(); y = 20; }
                    doc.setFontSize(9.5); doc.setFont("helvetica", "bold");
                    doc.text(pub.title, margin, y);
                    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
                    doc.setTextColor(100, 100, 100);
                    const pubDetail = [pub.publisher, pub.date].filter(Boolean).join(" \u00b7 ");
                    if (pubDetail) doc.text(pubDetail, margin + 3, y);
                    doc.setTextColor(0, 0, 0);
                    y += 5;
                });
            },
            languages: () => {
                const langs = languages || [];
                if (langs.length === 0) return;
                sectionHeader("Languages");
                langs.forEach((lang) => {
                    if (y > 275) { doc.addPage(); y = 20; }
                    doc.setFontSize(9.5); doc.setFont("helvetica", "normal");
                    const entry = lang.proficiency ? `${lang.name} \u2014 ${lang.proficiency}` : lang.name;
                    doc.text(`\u2022 ${entry}`, margin + 2, y);
                    y += 5;
                });
            },
            customSections: () => {
                const cs = customSections || [];
                if (cs.length === 0) return;
                cs.forEach((section) => {
                    sectionHeader(section.title);
                    section.items.forEach((item, idx) => {
                        if (y > 260) { doc.addPage(); y = 20; }
                        if (idx > 0) { doc.setDrawColor(240, 240, 240); doc.setLineWidth(0.1); doc.line(margin, y - 2, margin + width, y - 2); y += 2; }
                        if (item.title) {
                            doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text(item.title, margin, y);
                            if (item.date) { doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); doc.text(item.date, margin + width, y, { align: "right" }); }
                            y += 4.5;
                        }
                        if (item.subtitle || item.location) {
                            if (item.subtitle) { doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.text(item.subtitle, margin, y); }
                            if (item.location) { doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.text(item.location, margin + width, y, { align: "right" }); }
                            y += 5.5;
                        }
                        const descPoints = (item.description || "").split('\n').filter(p => p.trim() !== "");
                        descPoints.forEach((point) => {
                            const descLines = doc.splitTextToSize(point, width - 6);
                            descLines.forEach((line: string, idx: number) => {
                                if (y > 280) { doc.addPage(); y = 20; }
                                doc.setFont("helvetica", "normal"); doc.setFontSize(9);
                                doc.text(idx === 0 ? "\u2022  " + line : "   " + line, margin + 2, y);
                                y += 4;
                            });
                        });
                        y += 2;
                    });
                });
            },
        };

        // Render sections in specified order
        for (const type of order) {
            if (renderers[type]) {
                renderers[type]();
            }
        }

        // Append any sections not in the order list
        const orderedTypes = new Set(order);
        for (const [type, render] of Object.entries(renderers)) {
            if (!orderedTypes.has(type as SectionType)) {
                render();
            }
        }
    };

    renderCorporate();
    doc.save(`${personalInfo.fullName.replace(/\s+/g, '_')}_Resume_v3.0.pdf`);
};
