const fs = require('fs');
const path = 'app/ai-tools/resume-analyzer/ResumeAnalyzerClient.tsx';
let content = fs.readFileSync(path, 'utf8');

const newSection = `        // ============ EXPERIENCE ANALYSIS ============
        if (hasEnhanced && result.experienceAnalysis && result.experienceAnalysis.length > 0) {
            if (currentY > 235) { doc.addPage(); currentY = margin + 15 }
            addSectionBanner("07", "Experience Portfolio Analysis", \`Analysis of \${result.experienceAnalysis.length} professional experiences\`, [6, 182, 212])

            result.experienceAnalysis.forEach((exp: any, idx: number) => {
                if (currentY > 240) { doc.addPage(); currentY = margin + 15 }

                // Calculate overall experience score
                const dims = [
                    exp.technicalDepth || 0,
                    exp.businessImpact || 0,
                    exp.ownership || 0,
                    exp.leadershipScore || 0,
                    exp.communicationScore || 0,
                    exp.problemSolving || 0,
                    exp.recruiterAppeal || 0
                ]
                const overallScore = Math.round(dims.reduce((a, b) => a + b, 0) / dims.length)
                const scoreColorExp = overallScore > 70 ? successColor : overallScore > 40 ? warningColor : dangerColor

                // === EXPERIENCE HEADER CARD ===
                doc.setFillColor(255, 255, 255)
                doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2])
                doc.roundedRect(margin, currentY, contentW, 18, 6, 6, 'FD')

                // Left accent bar
                doc.setFillColor(6, 182, 212)
                doc.roundedRect(margin, currentY, 4, 18, 2, 2, 'F')

                // Score circle badge
                doc.setFillColor(scoreColorExp[0], scoreColorExp[1], scoreColorExp[2])
                doc.circle(margin + contentW - 22, currentY + 9, 9, 'F')
                doc.setFontSize(10)
                doc.setTextColor(255, 255, 255)
                doc.setFont("helvetica", "bold")
                doc.text(\`\${overallScore}\`, margin + contentW - 22, currentY + 13, { align: "center" })
                doc.setFontSize(5)
                doc.text("EXP", margin + contentW - 22, currentY + 4.5, { align: "center" })

                // Role & Organization
                doc.setFontSize(9.5)
                doc.setTextColor(darkText[0], darkText[1], darkText[2])
                doc.setFont("helvetica", "bold")
                doc.text(\`\${exp.role} @ \${exp.organization || exp.company}\`, margin + 12, currentY + 7)

                // Duration badge
                if (exp.duration) {
                    doc.setFontSize(6)
                    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2])
                    doc.setFont("helvetica", "normal")
                    doc.text(exp.duration, margin + 12, currentY + 13.5)
                }
                currentY += 24

                // === SCORE DIMENSIONS: 2-column progress bars ===
                const barDimensions = [
                    { label: 'Technical Depth', value: exp.technicalDepth || 0, color: [6, 182, 212] },
                    { label: 'Business Impact', value: exp.businessImpact || 0, color: [34, 197, 94] },
                    { label: 'Ownership', value: exp.ownership || 0, color: [139, 92, 246] },
                    { label: 'Leadership', value: exp.leadershipScore || 0, color: [249, 115, 22] },
                    { label: 'Communication', value: exp.communicationScore || 0, color: [236, 72, 153] },
                    { label: 'Problem Solving', value: exp.problemSolving || 0, color: [59, 130, 246] },
                    { label: 'Recruiter Appeal', value: exp.recruiterAppeal || 0, color: [234, 179, 8] },
                ]

                const barCardH = 10 + Math.ceil(barDimensions.length / 2) * 14
                if (currentY + barCardH > pageH - 30) { doc.addPage(); currentY = margin + 15 }

                doc.setFillColor(247, 248, 252)
                doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2])
                doc.roundedRect(margin, currentY, contentW, barCardH, 5, 5, 'FD')

                doc.setFontSize(7)
                doc.setTextColor(mutedText[0], mutedText[1], mutedText[2])
                doc.setFont("helvetica", "bold")
                doc.text("PERFORMANCE DIMENSIONS", margin + 10, currentY + 5)

                const barColW = (contentW - 30) / 2
                barDimensions.forEach((dim, dIdx) => {
                    const col = dIdx % 2
                    const row = Math.floor(dIdx / 2)
                    const bx = margin + 10 + col * (barColW + 10)
                    const by = currentY + 9 + row * 14

                    doc.setFontSize(6.5)
                    doc.setTextColor(darkText[0], darkText[1], darkText[2])
                    doc.setFont("helvetica", "bold")
                    doc.text(dim.label, bx, by + 3)

                    doc.setFontSize(6)
                    doc.setTextColor(dim.color[0], dim.color[1], dim.color[2])
                    doc.setFont("helvetica", "bold")
                    doc.text(\`\${dim.value}%\`, bx + barColW - 12, by + 3)

                    addProgressBar(bx, by + 5, barColW - 12, dim.value, dim.color)
                })
                currentY += barCardH + 8

                // === RECRUITER VERDICT CARD ===
                if (currentY > pageH - 50) { doc.addPage(); currentY = margin + 15 }

                doc.setFillColor(255, 255, 255)
                doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2])
                doc.roundedRect(margin, currentY, contentW, 34, 5, 5, 'FD')

                // Top accent
                doc.setFillColor(139, 92, 246)
                doc.roundedRect(margin, currentY, contentW, 3, 1.5, 1.5, 'F')

                doc.setFontSize(8)
                doc.setTextColor(139, 92, 246)
                doc.setFont("helvetica", "bold")
                doc.text("RECRUITER VERDICT", margin + 10, currentY + 9)

                let verdictY = currentY + 13

                // Overall assessment
                doc.setFontSize(7)
                doc.setTextColor(mutedText[0], mutedText[1], mutedText[2])
                doc.setFont("helvetica", "italic")
                const impressionText = exp.recruiterImpression ||
                    (overallScore > 70 ? "Strong candidate with compelling experience portfolio." :
                     overallScore > 40 ? "Candidate has solid foundations; some areas need strengthening." :
                     "Experience summary needs significant revision to be competitive.")
                const imprLines = doc.splitTextToSize(impressionText, contentW - 46)
                doc.text(imprLines, margin + 10, verdictY)
                verdictY += (imprLines.length * 3) + 3

                // Suitable roles
                const suitableRoles = exp.role ? [exp.role] : []
                doc.setFontSize(6.5)
                doc.setTextColor(darkText[0], darkText[1], darkText[2])
                doc.setFont("helvetica", "bold")
                doc.text("Suitable Roles:", margin + 10, verdictY)
                doc.setFont("helvetica", "normal")
                doc.setTextColor(mutedText[0], mutedText[1], mutedText[2])
                doc.text(suitableRoles.join(', ') || 'N/A', margin + 36, verdictY)
                verdictY += 4

                // Key strengths
                const keyStrengths = exp.strengths || []
                if (keyStrengths.length > 0) {
                    doc.setFontSize(6.5)
                    doc.setTextColor(darkText[0], darkText[1], darkText[2])
                    doc.setFont("helvetica", "bold")
                    doc.text("Key Strengths:", margin + 10, verdictY)
                    doc.setFontSize(6)
                    doc.setTextColor(successColor[0], successColor[1], successColor[2])
                    doc.setFont("helvetica", "normal")
                    keyStrengths.slice(0, 4).forEach((s) => {
                        doc.text("+ " + s, margin + 36, verdictY)
                        verdictY += 3.5
                    })
                }
                currentY += 38

                // === STRENGTHS & IMPROVEMENTS CARDS ===
                const strengths = exp.strengths || []
                const weaknesses = exp.weaknesses || []
                if (strengths.length > 0 || weaknesses.length > 0) {
                    if (currentY > pageH - 55) { doc.addPage(); currentY = margin + 15 }

                    const halfW = (contentW - 8) / 2

                    if (strengths.length > 0) {
                        doc.setFillColor(240, 253, 244)
                        doc.setDrawColor(34, 197, 94, 0.3)
                        doc.roundedRect(margin, currentY, halfW, 38, 5, 5, 'FD')

                        doc.setFontSize(7)
                        doc.setTextColor(22, 163, 74)
                        doc.setFont("helvetica", "bold")
                        doc.text("STRENGTHS", margin + 8, currentY + 8)

                        doc.setFont("helvetica", "normal")
                        doc.setFontSize(6.5)
                        doc.setTextColor(21, 128, 61)
                        strengths.slice(0, 6).forEach((s, si) => {
                            doc.text("+ " + s, margin + 10, currentY + 14 + si * 4.5)
                        })
                    }

                    if (weaknesses.length > 0) {
                        doc.setFillColor(254, 242, 242)
                        doc.setDrawColor(239, 68, 68, 0.3)
                        doc.roundedRect(margin + halfW + 8, currentY, halfW, 38, 5, 5, 'FD')

                        doc.setFontSize(7)
                        doc.setTextColor(220, 38, 38)
                        doc.setFont("helvetica", "bold")
                        doc.text("IMPROVEMENTS", margin + halfW + 16, currentY + 8)

                        doc.setFont("helvetica", "normal")
                        doc.setFontSize(6.5)
                        doc.setTextColor(185, 28, 28)
                        weaknesses.slice(0, 6).forEach((w, wi) => {
                            doc.text("- " + w, margin + halfW + 18, currentY + 14 + wi * 4.5)
                        })
                    }

                    currentY += 44
                }

                // === BEFORE / AFTER CARDS ===
                const weakBullets = exp.weakBulletPoints || []
                const improvedBullets = exp.improvedBullets || []

                if (weakBullets.length > 0 || improvedBullets.length > 0) {
                    if (currentY > pageH - 60) { doc.addPage(); currentY = margin + 15 }

                    const maxShow = Math.max(weakBullets.length, improvedBullets.length, 2)
                    const baCardH = 16 + maxShow * 10
                    const baHalfW = (contentW - 8) / 2

                    if (weakBullets.length > 0) {
                        doc.setFillColor(255, 245, 245)
                        doc.setDrawColor(239, 68, 68, 0.4)
                        doc.roundedRect(margin, currentY, baHalfW, baCardH, 5, 5, 'FD')

                        doc.setFillColor(239, 68, 68)
                        doc.roundedRect(margin + 6, currentY + 6, 28, 7, 3, 3, 'F')
                        doc.setFontSize(7)
                        doc.setTextColor(255, 255, 255)
                        doc.setFont("helvetica", "bold")
                        doc.text("BEFORE", margin + 20, currentY + 11.5, { align: "center" })

                        doc.setFont("helvetica", "normal")
                        doc.setFontSize(6)
                        doc.setTextColor(185, 28, 28)
                        weakBullets.slice(0, 4).forEach((b, bi) => {
                            const bLines = doc.splitTextToSize(b, baHalfW - 22)
                            doc.text(bLines, margin + 10, currentY + 18 + bi * 9)
                        })
                    }

                    if (improvedBullets.length > 0) {
                        doc.setFillColor(240, 253, 244)
                        doc.setDrawColor(34, 197, 94, 0.4)
                        doc.roundedRect(margin + baHalfW + 8, currentY, baHalfW, baCardH, 5, 5, 'FD')

                        doc.setFillColor(34, 197, 94)
                        doc.roundedRect(margin + baHalfW + 14, currentY + 6, 28, 7, 3, 3, 'F')
                        doc.setFontSize(7)
                        doc.setTextColor(255, 255, 255)
                        doc.setFont("helvetica", "bold")
                        doc.text("AFTER", margin + baHalfW + 28, currentY + 11.5, { align: "center" })

                        doc.setFont("helvetica", "normal")
                        doc.setFontSize(6)
                        doc.setTextColor(21, 128, 61)
                        improvedBullets.slice(0, 4).forEach((b, bi) => {
                            const bLines = doc.splitTextToSize(b, baHalfW - 22)
                            doc.text(bLines, margin + baHalfW + 18, currentY + 18 + bi * 9)
                        })
                    }

                    currentY += baCardH + 8
                }

                // === IMPACT SUMMARY CARD ===
                if (currentY > pageH - 35) { doc.addPage(); currentY = margin + 15 }

                doc.setFillColor(247, 248, 252)
                doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2])
                doc.roundedRect(margin, currentY, contentW, 22, 5, 5, 'FD')

                doc.setFontSize(6.5)
                doc.setTextColor(darkText[0], darkText[1], darkText[2])
                doc.setFont("helvetica", "bold")
                doc.text("IMPACT SUMMARY", margin + 10, currentY + 6)

                const impactMetrics = [
                    { label: "Resume Value", value: exp.technicalDepth || 0, color: primaryColor },
                    { label: "Technical Value", value: exp.technicalDepth || 0, color: [6, 182, 212] },
                    { label: "Industry Relevance", value: exp.businessImpact || 0, color: [34, 197, 94] },
                    { label: "Recruiter Appeal", value: exp.recruiterAppeal || 0, color: [234, 179, 8] },
                ]

                const impactW = (contentW - 28) / 4
                impactMetrics.forEach((m, mi) => {
                    const mx = margin + 10 + mi * (impactW + 6)

                    addProgressBar(mx, currentY + 10, impactW - 4, m.value, m.color)

                    doc.setFontSize(5.5)
                    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2])
                    doc.setFont("helvetica", "normal")
                    doc.text(m.label, mx, currentY + 18)

                    doc.setFontSize(7)
                    doc.setTextColor(m.color[0], m.color[1], m.color[2])
                    doc.setFont("helvetica", "bold")
                    doc.text(\`\${m.value}%\`, mx + impactW - 14, currentY + 8)
                })

                currentY += 28
            })
        }
`;

const startMarker = '// ============ EXPERIENCE ANALYSIS ============';
const endMarker = '// ============ FAANG READINESS ============';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

console.log('Start at:', startIdx);
console.log('End at:', endIdx);
console.log('Old section length:', endIdx - startIdx);

if (startIdx === -1) {
  console.error('ERROR: Could not find start marker');
  process.exit(1);
}
if (endIdx === -1) {
  console.error('ERROR: Could not find end marker');
  process.exit(1);
}

const newContent = content.substring(0, startIdx) + newSection + content.substring(endIdx);
fs.writeFileSync(path, newContent, 'utf8');
console.log('Replacement completed successfully');
console.log('New file length:', newContent.length);
