// lib/pdf/resume-report-pdf.ts
import { jsPDF } from "jspdf"
import { AnalysisResult } from "@/types"

/**
 * Professional styling constants based on the design brief.
 */
const C = {
  // Text colors
  text: "#111827",
  secondary: "#6B7280",
  // Light backgrounds
  tableHeader: "#F8FAFC",
  zebraOdd: "#FFFFFF",
  zebraEven: "#F8FAFC",
  // Borders
  border: "#E5E7EB",
  // Accents
  primary: "#6366F1",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  // Misc
  white: "#FFFFFF",
}

// Helper to convert hex to RGB for jsPDF color functions
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}
function setTextColor(d: jsPDF, hex: string) { const [r, g, b] = hexToRgb(hex); d.setTextColor(r, g, b) }
function setFillColor(d: jsPDF, hex: string) { const [r, g, b] = hexToRgb(hex); d.setFillColor(r, g, b) }
function setDrawColor(d: jsPDF, hex: string) { const [r, g, b] = hexToRgb(hex); d.setDrawColor(r, g, b) }

/** Layout helpers */
const MARGIN = 24 // page margin in pt
const PAGE_WIDTH = (d: jsPDF) => d.internal.pageSize.getWidth()
const PAGE_HEIGHT = (d: jsPDF) => d.internal.pageSize.getHeight()

function pageBackground(d: jsPDF) { setFillColor(d, C.white); d.rect(0, 0, PAGE_WIDTH(d), PAGE_HEIGHT(d), "F") }

// Header with logo placeholder
function addHeader(d: jsPDF, pw: number) {
  const h = 20;
  // Background
  setFillColor(d, C.white);
  d.rect(0, 0, pw, h, "F");
  // Logo placeholder (grey box)
  setFillColor(d, "#E5E7EB");
  d.rect(MARGIN, 4, 12, 12, "F");
  // Title text next to logo
  setTextColor(d, C.primary);
  d.setFontSize(10);
  d.setFont("helvetica", "bold");
  d.text("MENTORIX", MARGIN + 20, h / 2 + 2);
  setTextColor(d, C.secondary);
  d.setFont("helvetica", "normal");
  d.text("Resume Intelligence Report", MARGIN + d.getTextWidth("MENTORIX  ") + 28, h / 2 + 2);
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  d.text(date, pw - MARGIN, h / 2 + 2, { align: "right" });
}


function addFooter(d: jsPDF, pageNum: number, pw: number, ph: number) {
  setDrawColor(d, C.border)
  d.setLineWidth(0.3)
  d.line(MARGIN, ph - 12, pw - MARGIN, ph - 12)
  setTextColor(d, C.secondary)
  d.setFontSize(7)
  d.setFont("helvetica", "normal")
  d.text(`Mentorix AI Assessment • Page ${pageNum}`, pw / 2, ph - 6, { align: "center" })
}

function sectionTitle(d: jsPDF, title: string, y: number, pw: number) {
  setTextColor(d, C.primary)
  d.setFontSize(19)
  d.setFont("helvetica", "bold")
  d.text(title.toUpperCase(), MARGIN, y)
  setDrawColor(d, C.primary)
  d.setLineWidth(0.4)
  d.line(MARGIN, y + 2, pw - MARGIN, y + 2)
  return y + 20
}

function progressBar(d: jsPDF, x: number, y: number, w: number, pct: number, color: string) {
  const clamped = Math.min(100, Math.max(0, pct))
  const fillW = Math.max(2, (clamped / 100) * w)
  setFillColor(d, "#E5E7EB")
  d.rect(x, y, w, 5, "F")
  setFillColor(d, color)
  d.rect(x, y, fillW, 5, "F")
}

function scoreBadge(d: jsPDF, x: number, y: number, score: number) {
  const color = score >= 80 ? C.success : score >= 60 ? C.warning : C.danger
  setFillColor(d, color)
  d.rect(x, y, 38, 12, "F")
  setTextColor(d, C.white)
  d.setFontSize(8)
  d.setFont("helvetica", "bold")
  d.text(`${Math.round(score)}%`, x + 19, y + 9, { align: "center" })
}

/** Main export */
export function generateResumeReportPDF(result: AnalysisResult, targetRole?: string, fieldOfInterest?: string): jsPDF {
  const doc = new jsPDF()
  const pw = PAGE_WIDTH(doc)
  const ph = PAGE_HEIGHT(doc)
  let pageNum = 1

  // ------- Page 1 – Cover & Executive Summary -------
  pageBackground(doc)
  addHeader(doc, pw)
  setTextColor(doc, C.text)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("Resume Intelligence Report", pw / 2, 48, { align: "center" })
  const overall = result.overallScore ?? 0
  const subtitle = overall >= 80 ? "Exceptional Candidate Profile" : overall >= 60 ? "Strong Candidate Foundation" : overall >= 40 ? "Candidate With Development Areas" : "Early Career Profile – Growth Potential"
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  setTextColor(doc, C.secondary)
  doc.text(subtitle, pw / 2, 58, { align: "center" })
  const scColor = overall >= 80 ? C.success : overall >= 60 ? C.warning : C.danger
  setFillColor(doc, scColor)
  doc.circle(pw / 2, 88, 22, "F")
  setTextColor(doc, C.white)
  doc.setFontSize(20)
  doc.text(`${Math.round(overall)}`, pw / 2, 94, { align: "center" })
  doc.setFontSize(8)
  doc.text("OVERALL SCORE", pw / 2, 102, { align: "center" })

  // Quick stats table
  let y = 122
  const colW = (pw - 2 * MARGIN - 12) / 4
  const headers = ["SKILLS", "PROJECTS", "EXPERIENCES", "KEYWORDS"]
  setTextColor(doc, C.secondary)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  headers.forEach((h, i) => doc.text(h, MARGIN + i * (colW + 3), y))
  y += 5
  setDrawColor(doc, C.border)
  doc.line(MARGIN, y, pw - MARGIN, y)
  y += 3
  const values = [
    `${(result.strongSkills?.length ?? 0) + (result.missingSkills?.length ?? 0) + (result.criticalMissingSkills?.length ?? 0)}`,
    `${result.projects?.length ?? 0}`,
    `${result.experiences?.length ?? 0}`,
    `${result.matchedKeywords?.length ?? 0}`,
  ]
  setTextColor(doc, C.primary)
  doc.setFontSize(13)
  values.forEach((v, i) => doc.text(v, MARGIN + i * (colW + 3), y + 5))
  y += 12

  // Executive summary paragraph
  const summary = overall >= 80 ? "This candidate presents an exceptionally strong profile with demonstrated technical depth and relevant experience. Highly competitive for target roles." : overall >= 60 ? "This candidate shows solid foundational skills with clear strengths in key areas. Targeted improvements in specific skill gaps would significantly strengthen their profile." : overall >= 40 ? "This candidate has promising elements but needs focused development in several areas to be competitive for their target roles." : "This candidate is in early career stages with significant room for development. Focusing on building core skills and project experience will be key."
  doc.setFontSize(11)
  setTextColor(doc, C.text)
  doc.setFont("helvetica", "normal")
  const paragraph = doc.splitTextToSize(summary, pw - 2 * MARGIN)
  doc.text(paragraph, MARGIN, y)
  y += paragraph.length * 5 + 8

  // Verdict tagline
  setFillColor(doc, C.tableHeader)
  doc.rect(MARGIN, y, pw - 2 * MARGIN, 10, "F")
  setTextColor(doc, scColor)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(overall >= 80 ? "EXCELLENT" : overall >= 60 ? "GOOD" : overall >= 40 ? "FAIR" : "NEEDS WORK", MARGIN + 4, y + 7)
  setTextColor(doc, C.secondary)
  doc.text(`Profile Rating: ${targetRole || fieldOfInterest || "General"}`, MARGIN + 60, y + 7)

  addFooter(doc, pageNum, pw, ph)
  pageNum++

  // ------- Page 2 – Score Dashboard & Skills -------
  doc.addPage()
  pageBackground(doc)
  addHeader(doc, pw)
  y = MARGIN + 16
  y = sectionTitle(doc, "Score Summary", y, pw)

  const metrics = [
    { label: "Skills Assessment", value: result.skillsScore ?? 0, desc: `${result.strongSkills?.length ?? 0} strong – ${result.missingSkills?.length ?? 0} missing – ${result.criticalMissingSkills?.length ?? 0} critical` },
    { label: "Project Quality", value: result.projects?.reduce((a, p) => a + (p.projectScore ?? 0), 0) / (result.projects?.length || 1) ?? 0, desc: `${result.projects?.length ?? 0} project(s)` },
    { label: "Experience Relevance", value: result.experiences?.reduce((a, e) => a + (e.experienceScore ?? 0), 0) / (result.experiences?.length || 1) ?? 0, desc: `${result.experiences?.length ?? 0} experience(s)` },
    { label: "ATS Compatibility", value: result.atsScore ?? 0, desc: `${result.matchedKeywords?.length ?? 0} matched – ${result.missingKeywords?.length ?? 0} missing` },
    { label: "Company Readiness", value: result.companyReadinessScore ?? 0, desc: result.interviewProbability || "" },
  ]

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  metrics.forEach((m, i) => {
    if (y + 14 > ph - 20) { addFooter(doc, pageNum, pw, ph); doc.addPage(); pageBackground(doc); addHeader(doc, pw); y = MARGIN + 16; pageNum++ }
    if (i % 2 === 1) { setFillColor(doc, C.zebraEven); doc.rect(MARGIN, y, pw - 2 * MARGIN, 12, "F") }
    setTextColor(doc, C.text)
    doc.text(m.label, MARGIN + 4, y + 8)
    progressBar(doc, MARGIN + 80, y + 4, pw - MARGIN - 140, m.value, scoreBadgeColor(m.value))
    doc.setFontSize(8)
    setTextColor(doc, scoreBadgeColor(m.value))
    doc.text(`${Math.round(m.value)}%`, pw - MARGIN - 50, y + 8, { align: "right" })
    y += 14
  })

  // End of Score Summary – start new page for Skills
  addFooter(doc, pageNum, pw, ph)
  pageNum++
  doc.addPage()
  pageBackground(doc)
  addHeader(doc, pw)
  y = MARGIN + 16

  // ------- Skills Assessment -------
  y = sectionTitle(doc, "Skills Assessment", y, pw)
  const skillGroups = [
    { label: "Strong Skills", items: result.strongSkills ?? [], color: C.success },
    { label: "Missing Skills", items: result.missingSkills ?? [], color: C.warning },
    { label: "Critical Gaps", items: result.criticalMissingSkills ?? [], color: C.danger },
  ]
  skillGroups.forEach(g => {
    if (g.items.length === 0) return
    if (y + 30 > ph - 20) { addFooter(doc, pageNum, pw, ph); doc.addPage(); pageBackground(doc); addHeader(doc, pw); y = MARGIN + 16; pageNum++ }
    setTextColor(doc, g.color)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`${g.label} (${g.items.length})`, MARGIN, y + 7)
    let ySkill = y + 14
    g.items.forEach(item => {
      // Skill name
      setTextColor(doc, C.text)
      doc.setFontSize(8)
      doc.text(item, MARGIN + 4, ySkill)
      // Proficiency bar placeholder (70% width)
      const barX = MARGIN + 60
      const barW = pw - MARGIN - 80
      progressBar(doc, barX, ySkill - 4, barW, 70, g.color)
      ySkill += 12
    })
    y = ySkill + 4
  })

  // Recruiter verdict block (if present)
  if (result.skillsRecruiterVerdict) {
    if (y + 30 > ph - 20) { addFooter(doc, pageNum, pw, ph); doc.addPage(); pageBackground(doc); addHeader(doc, pw); y = MARGIN + 16; pageNum++ }
    setFillColor(doc, C.tableHeader)
    doc.rect(MARGIN, y, pw - 2 * MARGIN, 24, "F")
    setTextColor(doc, C.primary)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("RECRUITER VERDICT", MARGIN + 4, y + 9)
    setTextColor(doc, C.text)
    doc.setFontSize(8)
    const verdictLines = doc.splitTextToSize(result.skillsRecruiterVerdict, pw - 2 * MARGIN - 8)
    doc.text(verdictLines, MARGIN + 4, y + 16)
    y += 28
  }

  // End of Skills section – start Projects page
  addFooter(doc, pageNum, pw, ph)
  pageNum++
  doc.addPage()
  pageBackground(doc)
  addHeader(doc, pw)
  y = MARGIN + 16

  // ------- Project Analysis -------
  y = sectionTitle(doc, "Project Analysis", y, pw)
  result.projects?.forEach((proj, idx) => {
    if (y + 40 > ph - 20) { addFooter(doc, pageNum, pw, ph); doc.addPage(); pageBackground(doc); addHeader(doc, pw); y = MARGIN + 16; pageNum++ }
    // Card background
    setFillColor(doc, idx % 2 === 0 ? C.zebraOdd : C.zebraEven)
    doc.rect(MARGIN, y, pw - 2 * MARGIN, 36, "F")
    setTextColor(doc, C.text)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(proj.projectName || "Unnamed Project", MARGIN + 4, y + 10)
    const techList = (proj.technologies || []).slice(0, 5).join(", ")
    setTextColor(doc, C.secondary)
    doc.setFontSize(7)
    doc.text(techList, MARGIN + 4, y + 16)
    // Score badge on right side
    scoreBadge(doc, pw - MARGIN - 42, y + 8, proj.projectScore ?? 0)
    // Dimensions as small bars
    const dimY = y + 22
    const dimX = MARGIN + 4
    const dimW = pw - 2 * MARGIN - 8
    const dimensions = [
      { label: "Depth", value: proj.technicalDepth ?? 0 },
      { label: "Relevance", value: proj.industryRelevance ?? 0 },
      { label: "Scale", value: proj.scalability ?? 0 },
      { label: "Innov", value: proj.innovation ?? 0 },
      { label: "Value", value: proj.resumeValue ?? 0 },
    ]
    dimensions.forEach((dItem, i) => {
      const barY = dimY + i * 4
      progressBar(doc, dimX, barY, dimW, dItem.value, C.primary)
    })
    y += 44
  })
  addFooter(doc, pageNum, pw, ph)
  pageNum++

  // ------- Experience Analysis -------
  doc.addPage()
  pageBackground(doc)
  addHeader(doc, pw)
  y = MARGIN + 16
  y = sectionTitle(doc, "Experience Analysis", y, pw)
  setFillColor(doc, C.tableHeader)
  doc.rect(MARGIN, y, pw - 2 * MARGIN, 12, "F")
  setTextColor(doc, C.secondary)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  const headersExp = ["ROLE / COMPANY", "DURATION", "SCORE", "DIMENSIONS"]
  headersExp.forEach((h, i) => doc.text(h, MARGIN + i * (pw - 2 * MARGIN) / 4, y + 9))
  y += 14
  result.experiences?.forEach((exp, idx) => {
    if (y + 30 > ph - 20) { addFooter(doc, pageNum, pw, ph); doc.addPage(); pageBackground(doc); addHeader(doc, pw); y = MARGIN + 16; pageNum++ }
    if (idx % 2 === 1) { setFillColor(doc, C.zebraEven); doc.rect(MARGIN, y, pw - 2 * MARGIN, 24, "F") }
    setTextColor(doc, C.text)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`${exp.role ?? ""} @ ${exp.company ?? ""}`.trim(), MARGIN + 2, y + 8)
    setTextColor(doc, C.secondary)
    doc.setFontSize(7)
    const info = [exp.duration].filter(Boolean).join("  ·  ")
    doc.text(info, MARGIN + 2, y + 15)
    scoreBadge(doc, MARGIN + (pw - 2 * MARGIN) * 0.75, y + 2, exp.experienceScore ?? 0)
    const dims = [
      `Depth:${exp.technicalDepth ?? 0}%`,
      `Impact:${exp.businessImpact ?? 0}%`,
      `Exposure:${exp.industryExposure ?? 0}%`,
      `Relevance:${exp.roleRelevance ?? 0}%`,
    ].join(" · ")
    setTextColor(doc, C.secondary)
    doc.setFontSize(7)
    doc.text(dims, MARGIN + (pw - 2 * MARGIN) / 2, y + 22)
    y += 28
  })
  addFooter(doc, pageNum, pw, ph)
  pageNum++

  // ------- ATS Compatibility -------
  doc.addPage()
  pageBackground(doc)
  addHeader(doc, pw)
  y = MARGIN + 16
  y = sectionTitle(doc, "ATS Compatibility", y, pw)
  const atsScore = result.atsScore ?? 0
  const atsColor = atsScore >= 80 ? C.success : atsScore >= 60 ? C.warning : C.danger
  // ATS score badge
  setFillColor(doc, atsColor)
  doc.rect(MARGIN, y, 20, 18, "F")
  setTextColor(doc, C.white)
  doc.setFontSize(11)
  doc.text(`${Math.round(atsScore)}`, MARGIN + 10, y + 12, { align: "center" })
  // ATS compatibility bar chart
  y += 24
  progressBar(doc, MARGIN, y, pw - 2 * MARGIN, atsScore, atsColor)
  y += 12
  const kwGroups = [
    { label: "Matched", items: result.matchedKeywords ?? [], color: C.success },
    { label: "Missing", items: result.missingKeywords ?? [], color: C.danger },
    { label: "Critical", items: result.criticalMissingKeywords ?? [], color: C.warning },
  ]
  // render keyword tags as before
  kwGroups.forEach(g => {
    if (g.items.length === 0) return
    if (y + 20 > ph - 20) { addFooter(doc, pageNum, pw, ph); doc.addPage(); pageBackground(doc); addHeader(doc, pw); y = MARGIN + 16; pageNum++ }
    setTextColor(doc, C.text)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`${g.label} (${g.items.length})`, MARGIN, y + 7)
    let xPos = MARGIN + 60
    g.items.forEach(item => {
      const tagW = doc.getTextWidth(item) + 7
      if (xPos + tagW > pw - MARGIN) { xPos = MARGIN + 60; y += 12 }
      setFillColor(doc, g.color)
      doc.rect(xPos, y, tagW, 8, "F")
      setTextColor(doc, C.white)
      doc.setFontSize(7)
      doc.text(item, xPos + tagW / 2, y + 6, { align: "center" })
      xPos += tagW + 4
    })
    y += 18
  })
  if (result.expectedATSImprovement) {
    if (y + 30 > ph - 20) { addFooter(doc, pageNum, pw, ph); doc.addPage(); pageBackground(doc); addHeader(doc, pw); y = MARGIN + 16; pageNum++ }
    setTextColor(doc, C.warning)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("EXPECTED ATS IMPROVEMENT", MARGIN, y + 7)
    setTextColor(doc, C.text)
    doc.setFontSize(8)
    const impLines = doc.splitTextToSize(result.expectedATSImprovement, pw - 2 * MARGIN)
    doc.text(impLines, MARGIN, y + 14)
    y += impLines.length * 5 + 12
  }
  addFooter(doc, pageNum, pw, ph)
  pageNum++

  // ------- Company Readiness -------
  doc.addPage()
  pageBackground(doc)
  addHeader(doc, pw)
  y = MARGIN + 16
  y = sectionTitle(doc, "Company Readiness", y, pw)
  const crScore = result.companyReadinessScore ?? 0
  const crColor = crScore >= 80 ? C.success : crScore >= 60 ? C.warning : C.danger
  // Company readiness badge
  setFillColor(doc, crColor)
  doc.rect(MARGIN, y, 20, 18, "F")
  setTextColor(doc, C.white)
  doc.setFontSize(11)
  doc.text(`${Math.round(crScore)}`, MARGIN + 10, y + 12, { align: "center" })
  // Readiness bar chart
  y += 24
  progressBar(doc, MARGIN, y, pw - 2 * MARGIN, crScore, crColor)
  y += 12
  const crGroups = [
    { label: "Strengths", items: result.companyReadinessStrengths ?? [], color: C.success },
    { label: "Weaknesses", items: result.companyReadinessWeaknesses ?? [], color: C.danger },
    { label: "Missing Skills", items: result.companyReadinessMissingSkills ?? [], color: C.warning },
  ]
  crGroups.forEach(g => {
    if (g.items.length === 0) return
    if (y + 20 > ph - 20) { addFooter(doc, pageNum, pw, ph); doc.addPage(); pageBackground(doc); addHeader(doc, pw); y = MARGIN + 16; pageNum++ }
    setTextColor(doc, C.text)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`${g.label} (${g.items.length})`, MARGIN, y + 7)
    let xPos = MARGIN + 60
    g.items.forEach(item => {
      const tagW = doc.getTextWidth(item) + 7
      if (xPos + tagW > pw - MARGIN) { xPos = MARGIN + 60; y += 12 }
      setFillColor(doc, g.color)
      doc.rect(xPos, y, tagW, 8, "F")
      setTextColor(doc, C.white)
      doc.setFontSize(7)
      doc.text(item, xPos + tagW / 2, y + 6, { align: "center" })
      xPos += tagW + 4
    })
    y += 18
  })
  if (result.companyReadinessAreas?.length) {
    if (y + 10 > ph - 20) { addFooter(doc, pageNum, pw, ph); doc.addPage(); pageBackground(doc); addHeader(doc, pw); y = MARGIN + 16; pageNum++ }
    setTextColor(doc, C.text)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("Area Breakdown", MARGIN, y + 7)
    y += 12
    result.companyReadinessAreas.forEach(areaObj => {
      const area = areaObj.area ?? ""
      const score = areaObj.score ?? 0
      const barColor = score >= 70 ? C.success : score >= 45 ? C.warning : C.danger
      setTextColor(doc, C.text)
      doc.setFontSize(7)
      doc.text(area, MARGIN, y + 5)
      progressBar(doc, MARGIN + 60, y, pw - MARGIN - 90, score, barColor)
      setTextColor(doc, barColor)
      doc.setFontSize(7)
      doc.text(`${Math.round(score)}%`, pw - MARGIN - 20, y + 5, { align: "right" })
      y += 12
    })
  }
  addFooter(doc, pageNum, pw, ph)
  pageNum++

  // ------- Final Verdict & Recruiter Notes -------
  doc.addPage()
  pageBackground(doc)
  addHeader(doc, pw)
  y = MARGIN + 16
  y = sectionTitle(doc, "Final Verdict", y, pw)
  if (result.companyReadinessVerdict) {
    const lines = doc.splitTextToSize(result.companyReadinessVerdict, pw - 2 * MARGIN)
    setTextColor(doc, C.text)
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(lines, MARGIN, y)
    y += lines.length * 5 + 8
  }
  if (result.recruiterReport) {
    const lines = doc.splitTextToSize(result.recruiterReport, pw - 2 * MARGIN)
    setTextColor(doc, C.text)
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(lines, MARGIN, y)
    y += lines.length * 5 + 8
  }
  addFooter(doc, pageNum, pw, ph)

  return doc
}

/** Helper to decide badge color based on a percentage */
function scoreBadgeColor(pct: number): string { return pct >= 80 ? C.success : pct >= 60 ? C.warning : C.danger }
