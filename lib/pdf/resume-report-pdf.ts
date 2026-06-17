import { jsPDF } from "jspdf"
import { AnalysisResult } from "@/types"

// ─── Color Palette — Professional Report ──────────────────────────────
const C = {
  bg: "#FFFFFF",
  text: "#1E293B",
  muted: "#64748B",
  light: "#F1F5F9",
  border: "#E2E8F0",
  primary: "#4F46E5",
  accent: "#7C3AED",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  orange: "#D97706",
  headerBg: "#0F172A",
}

const getScoreColor = (s: number) => s >= 80 ? C.success : s >= 60 ? C.warning : s >= 40 ? C.orange : C.danger
const getScoreLabel = (s: number) => s >= 80 ? "Excellent" : s >= 60 ? "Good" : s >= 40 ? "Fair" : "Needs Work"

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function hexRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function txt(d: jsPDF, hex: string) { const [r, g, b] = hexRgb(hex); d.setTextColor(r, g, b) }
function fill(d: jsPDF, hex: string) { const [r, g, b] = hexRgb(hex); d.setFillColor(r, g, b) }
function drw(d: jsPDF, hex: string) { const [r, g, b] = hexRgb(hex); d.setDrawColor(r, g, b) }

function pageBg(d: jsPDF, pw: number, ph: number) {
  fill(d, C.bg); d.rect(0, 0, pw, ph, "F")
}

// ─── Header — clean brand bar ────────────────────────────────────────
function addHeader(d: jsPDF, m: number, pw: number) {
  fill(d, C.headerBg); d.rect(0, 0, pw, 18, "F")
  txt(d, "#FFFFFF")
  d.setFontSize(9); d.setFont("helvetica", "bold")
  d.text("MENTORIX", m, 12)
  d.setFont("helvetica", "normal"); d.setFontSize(7)
  txt(d, "#94A3B8"); d.text("Resume Intelligence Report", m + d.getTextWidth("MENTORIX  "), 12)
  const ds = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  d.text(ds, pw - m, 12, { align: "right" })
}

// ─── Footer — clean page number ──────────────────────────────────────
function addFooter(d: jsPDF, pn: number, tp: number, m: number, pw: number, ph: number) {
  drw(d, C.border); d.setLineWidth(0.3)
  d.line(m, ph - 14, pw - m, ph - 14)
  d.setFontSize(7); d.setFont("helvetica", "normal")
  txt(d, C.muted)
  d.text(`Mentorix AI Assessment  ·  Page ${pn} of ${tp}`, pw / 2, ph - 7, { align: "center" })
}

// ─── Section Title ────────────────────────────────────────────────────
function section(d: jsPDF, title: string, y: number, m: number, pw: number): number {
  drw(d, C.primary); d.setLineWidth(0.5)
  d.line(m, y, pw - m, y)
  txt(d, C.primary)
  d.setFontSize(11); d.setFont("helvetica", "bold")
  d.text(title.toUpperCase(), m, y + 4)
  return y + 10
}

// ─── Progress Bar (thin, report-style) ────────────────────────────────
function scoreBar(d: jsPDF, x: number, y: number, w: number, h: number, pct: number, color: string) {
  const c = Math.min(Math.max(pct, 0), 100)
  const fw = Math.max(2, (c / 100) * w)
  fill(d, C.light); d.rect(x, y, w, h, "F")
  fill(d, color); d.rect(x, y, fw, h, "F")
}

// ─── Score Table Row ──────────────────────────────────────────────────
function scoreRow(d: jsPDF, x: number, y: number, w: number, label: string, score: number, desc: string) {
  const sc = getScoreColor(score)
  const sl = getScoreLabel(score)
  // Label
  txt(d, C.text); d.setFontSize(8); d.setFont("helvetica", "bold")
  d.text(label, x, y + 3)
  // Bar
  scoreBar(d, x + 74, y, w - 150, 5, score, sc)
  // Percentage
  txt(d, sc); d.setFontSize(8); d.setFont("helvetica", "bold")
  d.text(`${Math.round(score)}%`, x + w - 74, y + 3, { align: "right" })
  // Label
  txt(d, C.muted); d.setFontSize(6); d.setFont("helvetica", "normal")
  d.text(sl, x + w - 26, y + 3, { align: "right" })
  // Description
  txt(d, C.muted); d.setFontSize(6.5)
  d.text(desc, x + 74, y + 8)
}

// ─── Tag (inline colored label) ──────────────────────────────────────
function tag(d: jsPDF, x: number, y: number, text: string, color: string) {
  const tw = d.getTextWidth(text) + 8
  fill(d, color); d.rect(x, y, tw, 9, "F")
  txt(d, "#FFFFFF"); d.setFontSize(6); d.setFont("helvetica", "bold")
  d.text(text, x + tw / 2, y + 6.5, { align: "center" })
  return tw + 3
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════
export function generateResumeReportPDF(
  result: AnalysisResult,
  targetRole?: string,
  fieldOfInterest?: string,
): jsPDF {
  const d = new jsPDF()
  const pw = d.internal.pageSize.getWidth()
  const ph = d.internal.pageSize.getHeight()
  const M = 14
  const cw = pw - 2 * M

  // ─── Data ───────────────────────────────────────────────────────────
  const s = {
    ov: result.overallScore ?? result.score ?? 0,
    ss: result.skillsScore ?? 0,
    strong: result.strongSkills ?? [],
    missing: result.missingSkills ?? [],
    crit: result.criticalMissingSkills ?? [],
    sv: result.skillsRecruiterVerdict || "",
    projs: result.projects ?? [],
    exps: result.experiences ?? [],
    ats: result.atsScore ?? 0,
    mk: result.matchedKeywords ?? [],
    misk: result.missingKeywords ?? [],
    ck: result.criticalMissingKeywords ?? [],
    atsImp: result.expectedATSImprovement || "",
    crs: result.companyReadinessScore ?? 0,
    cra: result.companyReadinessAreas ?? [],
    crStr: result.companyReadinessStrengths ?? [],
    crWk: result.companyReadinessWeaknesses ?? [],
    crMiss: result.companyReadinessMissingSkills ?? [],
    iv: result.interviewProbability || "",
    crv: result.companyReadinessVerdict || "",
    rr: result.recruiterReport || "",
  }

  const avgPs = s.projs.length > 0 ? Math.round(s.projs.reduce((a, p) => a + (p.projectScore || 0), 0) / s.projs.length) : 0
  const avgEs = s.exps.length > 0 ? Math.round(s.exps.reduce((a, e) => a + (e.experienceScore || 0), 0) / s.exps.length) : 0

  let cp = 1
  const TP = 7

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 1 — Executive Summary
  // ═══════════════════════════════════════════════════════════════════
  pageBg(d, pw, ph)
  addHeader(d, M, pw)

  // Report title block
  txt(d, C.text)
  d.setFontSize(22); d.setFont("helvetica", "bold")
  d.text("Resume Intelligence Report", pw / 2, 40, { align: "center" })
  txt(d, C.muted)
  d.setFontSize(11); d.setFont("helvetica", "normal")
  const tagLine = s.ov >= 80 ? "Exceptional Candidate Profile" : s.ov >= 60 ? "Strong Candidate Foundation" : s.ov >= 40 ? "Candidate With Development Areas" : "Early Career Profile — Significant Growth Potential"
  d.text(tagLine, pw / 2, 49, { align: "center" })

  // Overall score — large, clean
  const sc = getScoreColor(s.ov)
  const [sr, sg, sb] = hexRgb(sc)
  d.setFillColor(sr, sg, sb)
  d.rect((pw - 50) / 2, 60, 50, 50, "F")
  txt(d, "#FFFFFF"); d.setFontSize(28); d.setFont("helvetica", "bold")
  d.text(`${Math.round(s.ov)}`, pw / 2, 88, { align: "center" })
  txt(d, "#FFFFFF"); d.setFontSize(7); d.setFont("helvetica", "bold")
  d.text("OVERALL SCORE", pw / 2, 100, { align: "center" })

  // Target info
  let ty = 122
  if (targetRole || fieldOfInterest) {
    txt(d, C.muted); d.setFontSize(7); d.setFont("helvetica", "bold")
    d.text("TARGET ROLE", pw / 2, ty, { align: "center" })
    txt(d, C.text); d.setFontSize(10); d.setFont("helvetica", "normal")
    d.text(targetRole || fieldOfInterest || "", pw / 2, ty + 8, { align: "center" })
    ty += 20
  }

  // Quick stats row
  drw(d, C.border); d.setLineWidth(0.3)
  d.line(M, ty, pw - M, ty)
  ty += 6
  const qStats = [
    { label: "Skills Evaluated", value: `${s.strong.length + s.missing.length + s.crit.length}` },
    { label: "Projects", value: `${s.projs.length}` },
    { label: "Experience Entries", value: `${s.exps.length}` },
    { label: "Keywords Matched", value: `${s.mk.length}` },
  ]
  const qw = (cw - 20) / 4
  for (let i = 0; i < qStats.length; i++) {
    const qx = M + i * (qw + 6)
    fill(d, C.light); d.rect(qx, ty, qw, 24, "F")
    txt(d, C.primary); d.setFontSize(14); d.setFont("helvetica", "bold")
    d.text(qStats[i].value, qx + qw / 2, ty + 10, { align: "center" })
    txt(d, C.muted); d.setFontSize(6); d.setFont("helvetica", "bold")
    d.text(qStats[i].label.toUpperCase(), qx + qw / 2, ty + 20, { align: "center" })
  }

  // Verdict / summary text
  const vt = d.splitTextToSize(
    s.ov >= 80
      ? "This candidate presents an exceptionally strong profile with demonstrated technical depth and relevant experience. Highly competitive for target roles."
      : s.ov >= 60
        ? "This candidate shows solid foundational skills with clear strengths in key areas. Targeted improvements in specific skill gaps would significantly strengthen their profile."
        : s.ov >= 40
          ? "This candidate has promising elements but needs focused development in several areas to be competitive for their target roles."
          : "This candidate is in early career stages with significant room for development. Focusing on building core skills and project experience will be key.",
    cw,
  )
  txt(d, C.text); d.setFontSize(8); d.setFont("helvetica", "normal")
  d.text(vt, M, ty + 34)

  addFooter(d, 1, TP, M, pw, ph)

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 2 — Score Dashboard
  // ═══════════════════════════════════════════════════════════════════
  d.addPage(); cp++
  pageBg(d, pw, ph)
  addHeader(d, M, pw)
  let y = M + 22

  y = section(d, "Score Summary", y, M, pw)

  // Column headers
  txt(d, C.muted); d.setFontSize(6); d.setFont("helvetica", "bold")
  d.text("METRIC", M, y + 2)
  d.text("SCORE", M + cw - 74, y + 2, { align: "right" })
  d.text("STATUS", M + cw - 26, y + 2, { align: "right" })
  drw(d, C.border); d.setLineWidth(0.3)
  d.line(M, y + 4, M + cw, y + 4)
  y += 8

  const metrics = [
    { label: "Skills Assessment", value: s.ss, desc: "Technical breadth and depth evaluation" },
    { label: "Project Quality", value: avgPs, desc: s.projs.length > 0 ? `Across ${s.projs.length} project(s)` : "No projects analyzed" },
    { label: "Experience Relevance", value: avgEs, desc: s.exps.length > 0 ? `Across ${s.exps.length} experience(s)` : "No experiences analyzed" },
    { label: "ATS Compatibility", value: s.ats, desc: `${s.mk.length} matched · ${s.misk.length} missing keywords` },
    { label: "Company Readiness", value: s.crs, desc: s.iv ? `Interview probability: ${s.iv}` : "Target role readiness" },
  ]
  for (const m of metrics) {
    scoreRow(d, M, y, cw, m.label, m.value, m.desc)
    y += 15
  }

  // Skills Assessment section
  y += 4
  y = section(d, "Skills Assessment", y, M, pw)

  const skillGroups = [
    { label: "Strong Skills", items: s.strong, color: C.success },
    { label: "Missing Skills", items: s.missing, color: C.warning },
    { label: "Critical Gaps", items: s.crit, color: C.danger },
  ]
  for (const g of skillGroups) {
    if (g.items.length === 0) continue
    if (y + 10 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }
    txt(d, g.color); d.setFontSize(7); d.setFont("helvetica", "bold")
    d.text(`${g.label}  (${g.items.length})`, M, y)
    y += 5
    let px = M
    for (const item of g.items) {
      const tw = d.getTextWidth(item) + 8
      if (px + tw + 4 > pw - M) { px = M; y += 10 }
      px += tag(d, px, y, item, g.color)
    }
    y += 12
  }

  // Verdict
  if (s.sv) {
    if (y + 16 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }
    const vt = d.splitTextToSize(s.sv, cw)
    fill(d, C.light); d.rect(M, y, cw, 10 + vt.length * 4.5, "F")
    txt(d, C.primary); d.setFontSize(7); d.setFont("helvetica", "bold")
    d.text("RECRUITER VERDICT", M + 4, y + 5)
    txt(d, C.text); d.setFontSize(7.5); d.setFont("helvetica", "normal")
    d.text(vt, M + 4, y + 11)
    y += 12 + vt.length * 4.5
  }

  addFooter(d, cp, TP, M, pw, ph)

  // ═══════════════════════════════════════════════════════════════════
  // PAGES 3-4 — Project Analysis
  // ═══════════════════════════════════════════════════════════════════
  if (s.projs.length > 0) {
    d.addPage(); cp++
    pageBg(d, pw, ph)
    addHeader(d, M, pw)
    y = M + 22
    y = section(d, "Project Analysis", y, M, pw)

    for (const proj of s.projs) {
      // Estimate card height
      const techs = proj.technologies || []
      const techLine = techs.length > 0 ? `Tech: ${techs.slice(0, 8).join(", ")}` : ""
      const hasS = !!proj.strength
      const hasI = !!proj.improvement
      const hasV = !!proj.recruiterVerdict

      let ch = 18
      if (techLine) ch += 8
      ch += 18 // dimension bars row
      if (hasS || hasI) ch += 16
      if (hasV) ch += 10 + d.splitTextToSize(proj.recruiterVerdict!, cw - 8).length * 4.5

      if (y + ch + 4 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }

      // Project entry — border left accent
      fill(d, C.light); d.rect(M, y, 2, ch, "F")
      fill(d, C.bg); d.rect(M + 2, y, cw - 2, ch, "F")

      // Header: name + score
      txt(d, C.primary); d.setFontSize(9); d.setFont("helvetica", "bold")
      d.text(proj.projectName || "Unnamed Project", M + 8, y + 7)
      const sc = getScoreColor(proj.projectScore || 0)
      const [sr, sg, sb] = hexRgb(sc)
      d.setFillColor(sr, sg, sb)
      d.rect(M + cw - 32, y + 2, 24, 9, "F")
      txt(d, "#FFFFFF"); d.setFontSize(7); d.setFont("helvetica", "bold")
      d.text(`${Math.round(proj.projectScore || 0)}`, M + cw - 20, y + 8.5, { align: "center" })

      // Tech stack line
      let iy = y + 10
      if (techLine) {
        txt(d, C.muted); d.setFontSize(6.5); d.setFont("helvetica", "normal")
        d.text(techLine, M + 8, iy + 4)
        iy += 8
      }

      // Dimension bars
      const dims = [
        { l: "Technical Depth", v: proj.technicalDepth || 0, c: C.primary },
        { l: "Industry Relevance", v: proj.industryRelevance || 0, c: C.accent },
        { l: "Scalability", v: proj.scalability || 0, c: "#0891B2" },
        { l: "Innovation", v: proj.innovation || 0, c: C.warning },
        { l: "Resume Value", v: proj.resumeValue || 0, c: C.success },
      ]
      const bw = (cw - 60) / 5
      for (let i = 0; i < dims.length; i++) {
        const dx = M + 8 + i * (bw + 2)
        scoreBar(d, dx, iy, bw, 4, dims[i].v, dims[i].c)
        txt(d, C.muted); d.setFontSize(5.5); d.setFont("helvetica", "bold")
        d.text(dims[i].l, dx + bw / 2, iy + 7, { align: "center" })
        txt(d, dims[i].c); d.setFontSize(6); d.setFont("helvetica", "bold")
        d.text(`${Math.round(dims[i].v)}%`, dx + bw / 2, iy + 12.5, { align: "center" })
      }
      iy += 16

      // Strength + Improvement
      if (hasS || hasI) {
        if (hasS) {
          txt(d, C.success); d.setFontSize(6.5); d.setFont("helvetica", "bold")
          d.text("STRENGTH", M + 8, iy)
          txt(d, C.text); d.setFont("helvetica", "normal")
          const sl = d.splitTextToSize(proj.strength!, (cw - 24) / 2)
          d.text(sl, M + 8, iy + 4.5)
        }
        if (hasI) {
          txt(d, C.danger); d.setFontSize(6.5); d.setFont("helvetica", "bold")
          d.text("IMPROVEMENT", M + cw / 2 + 4, iy)
          txt(d, C.text); d.setFont("helvetica", "normal")
          const il = d.splitTextToSize(proj.improvement!, (cw - 24) / 2)
          d.text(il, M + cw / 2 + 4, iy + 4.5)
        }
        iy += hasS && hasI ? 14 : 10
      }

      // Verdict
      if (hasV) {
        txt(d, C.accent); d.setFontSize(6.5); d.setFont("helvetica", "bold")
        d.text("RECRUITER VERDICT", M + 8, iy)
        txt(d, C.muted); d.setFont("helvetica", "italic")
        const vl = d.splitTextToSize(proj.recruiterVerdict!, cw - 16)
        d.text(vl, M + 8, iy + 4.5)
      }

      y += ch + 6
    }
    addFooter(d, cp, TP, M, pw, ph)
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 5 — Experience Analysis
  // ═══════════════════════════════════════════════════════════════════
  if (s.exps.length > 0) {
    d.addPage(); cp++
    pageBg(d, pw, ph)
    addHeader(d, M, pw)
    y = M + 22
    y = section(d, "Experience Analysis", y, M, pw)

    for (const exp of s.exps) {
      const hasS = !!exp.strength
      const hasI = !!exp.improvement
      const hasV = !!exp.recruiterVerdict
      let ch = 16
      ch += 16 // dim bars
      if (hasS || hasI) ch += 16
      if (hasV) ch += 10 + d.splitTextToSize(exp.recruiterVerdict!, cw - 8).length * 4.5

      if (y + ch + 4 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }

      // Left accent bar
      fill(d, C.light); d.rect(M, y, 2, ch, "F")
      fill(d, C.bg); d.rect(M + 2, y, cw - 2, ch, "F")

      // Role + Company + Duration
      txt(d, C.primary); d.setFontSize(9); d.setFont("helvetica", "bold")
      d.text(exp.role || "Role", M + 8, y + 7)
      txt(d, C.muted); d.setFontSize(7); d.setFont("helvetica", "normal")
      const co = exp.company || ""
      const du = exp.duration || ""
      d.text(co, M + 8 + d.getTextWidth(exp.role || "Role") + 6, y + 7)
      if (du) d.text(du, M + cw - 8, y + 7, { align: "right" })

      // Score badge
      const sc = getScoreColor(exp.experienceScore || 0)
      const [sr, sg, sb] = hexRgb(sc)
      d.setFillColor(sr, sg, sb)
      d.rect(M + cw - 32, y + 2, 24, 9, "F")
      txt(d, "#FFFFFF"); d.setFontSize(7); d.setFont("helvetica", "bold")
      d.text(`${Math.round(exp.experienceScore || 0)}`, M + cw - 20, y + 8.5, { align: "center" })

      // Dimension bars
      const dims = [
        { l: "Technical Depth", v: exp.technicalDepth || 0, c: C.primary },
        { l: "Business Impact", v: exp.businessImpact || 0, c: C.accent },
        { l: "Industry Exposure", v: exp.industryExposure || 0, c: "#0891B2" },
        { l: "Role Relevance", v: exp.roleRelevance || 0, c: C.success },
      ]
      let iy = y + 12
      const bw = (cw - 48) / 4
      for (let i = 0; i < dims.length; i++) {
        const dx = M + 8 + i * (bw + 2)
        scoreBar(d, dx, iy, bw, 4, dims[i].v, dims[i].c)
        txt(d, C.muted); d.setFontSize(5.5); d.setFont("helvetica", "bold")
        d.text(dims[i].l, dx + bw / 2, iy + 7, { align: "center" })
        txt(d, dims[i].c); d.setFontSize(6); d.setFont("helvetica", "bold")
        d.text(`${Math.round(dims[i].v)}%`, dx + bw / 2, iy + 12.5, { align: "center" })
      }
      iy += 16

      if (hasS || hasI) {
        if (hasS) {
          txt(d, C.success); d.setFontSize(6.5); d.setFont("helvetica", "bold")
          d.text("STRENGTH", M + 8, iy)
          txt(d, C.text); d.setFont("helvetica", "normal")
          const sl = d.splitTextToSize(exp.strength!, (cw - 24) / 2)
          d.text(sl, M + 8, iy + 4.5)
        }
        if (hasI) {
          txt(d, C.danger); d.setFontSize(6.5); d.setFont("helvetica", "bold")
          d.text("IMPROVEMENT", M + cw / 2 + 4, iy)
          txt(d, C.text); d.setFont("helvetica", "normal")
          const il = d.splitTextToSize(exp.improvement!, (cw - 24) / 2)
          d.text(il, M + cw / 2 + 4, iy + 4.5)
        }
        iy += hasS && hasI ? 14 : 10
      }

      if (hasV) {
        txt(d, C.accent); d.setFontSize(6.5); d.setFont("helvetica", "bold")
        d.text("VERDICT", M + 8, iy)
        txt(d, C.muted); d.setFont("helvetica", "italic")
        const vl = d.splitTextToSize(exp.recruiterVerdict!, cw - 16)
        d.text(vl, M + 8, iy + 4.5)
      }

      y += ch + 6
    }
    addFooter(d, cp, TP, M, pw, ph)
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 6 — ATS Compatibility
  // ═══════════════════════════════════════════════════════════════════
  d.addPage(); cp++
  pageBg(d, pw, ph)
  addHeader(d, M, pw)
  y = M + 22
  y = section(d, "ATS Compatibility Analysis", y, M, pw)

  // ATS Score + Overview
  fill(d, C.light); d.rect(M, y, cw, 32, "F")
  const scA = getScoreColor(s.ats)
  const [ar, ag, ab] = hexRgb(scA)
  d.setFillColor(ar, ag, ab)
  d.rect(M + 6, y + 4, 28, 24, "F")
  txt(d, "#FFFFFF"); d.setFontSize(14); d.setFont("helvetica", "bold")
  d.text(`${Math.round(s.ats)}`, M + 20, y + 19, { align: "center" })
  txt(d, "#FFFFFF"); d.setFontSize(5); d.setFont("helvetica", "bold")
  d.text("ATS", M + 20, y + 26, { align: "center" })

  txt(d, C.text); d.setFontSize(9); d.setFont("helvetica", "bold")
  d.text("ATS Score Overview", M + 42, y + 10)
  const kwC = [
    { l: "Matched", n: s.mk.length, c: C.success },
    { l: "Missing", n: s.misk.length, c: C.danger },
    { l: "Critical", n: s.ck.length, c: C.warning },
  ]
  let kx = M + 44
  for (const kw of kwC) {
    txt(d, kw.c); d.setFontSize(10); d.setFont("helvetica", "bold")
    d.text(`${kw.n}`, kx, y + 22)
    txt(d, C.muted); d.setFontSize(6); d.setFont("helvetica", "bold")
    d.text(kw.l, kx, y + 28)
    kx += 28
  }
  y += 36

  // Keywords
  const kwG = [
    { l: "Matched Keywords", items: s.mk, c: C.success },
    { l: "Missing Keywords", items: s.misk, c: C.danger },
    { l: "Critical Missing", items: s.ck, c: C.warning },
  ]
  for (const g of kwG) {
    if (g.items.length === 0) continue
    if (y + 10 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }
    txt(d, g.c); d.setFontSize(7); d.setFont("helvetica", "bold")
    d.text(g.l, M, y)
    y += 5
    let px = M
    for (const item of g.items.slice(0, 20)) {
      px += tag(d, px, y, item, g.c)
      if (px + 20 > pw - M) { px = M; y += 10 }
    }
    y += 12
  }

  if (s.atsImp) {
    if (y + 16 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }
    const il = d.splitTextToSize(s.atsImp, cw)
    fill(d, C.light); d.rect(M, y, cw, 12 + il.length * 4.5, "F")
    txt(d, C.warning); d.setFontSize(7); d.setFont("helvetica", "bold")
    d.text("EXPECTED ATS IMPROVEMENT", M + 4, y + 5)
    txt(d, C.text); d.setFontSize(7.5); d.setFont("helvetica", "normal")
    d.text(il, M + 4, y + 11)
    y += 14 + il.length * 4.5
  }

  addFooter(d, 6, TP, M, pw, ph)

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 7 — Company Readiness + Recruiter Notes
  // ═══════════════════════════════════════════════════════════════════
  d.addPage(); cp++
  pageBg(d, pw, ph)
  addHeader(d, M, pw)
  y = M + 22
  y = section(d, "Company Readiness Assessment", y, M, pw)

  // Readiness overview
  fill(d, C.light); d.rect(M, y, cw, 28, "F")
  const scR = getScoreColor(s.crs)
  const [rr, rg, rb] = hexRgb(scR)
  d.setFillColor(rr, rg, rb)
  d.rect(M + 6, y + 3, 24, 22, "F")
  txt(d, "#FFFFFF"); d.setFontSize(12); d.setFont("helvetica", "bold")
  d.text(`${Math.round(s.crs)}`, M + 18, y + 17, { align: "center" })
  txt(d, "#FFFFFF"); d.setFontSize(5); d.setFont("helvetica", "bold")
  d.text("READY", M + 18, y + 23, { align: "center" })

  const rl = s.crs >= 80 ? "Highly Prepared" : s.crs >= 60 ? "Moderately Prepared" : s.crs >= 40 ? "Partially Prepared" : "Needs Preparation"
  txt(d, C.text); d.setFontSize(9); d.setFont("helvetica", "bold")
  d.text(rl, M + 38, y + 10)
  if (s.iv) {
    txt(d, C.primary); d.setFontSize(7); d.setFont("helvetica", "bold")
    d.text(s.iv, M + 38, y + 19)
  }
  y += 34

  // Strengths / Weaknesses / Missing
  if (s.crStr.length > 0 || s.crWk.length > 0 || s.crMiss.length > 0) {
    y = section(d, "Key Findings", y, M, pw)

    if (s.crStr.length > 0) {
      txt(d, C.success); d.setFontSize(7); d.setFont("helvetica", "bold")
      d.text("Strengths", M, y)
      y += 5
      let px = M
      for (const st of s.crStr) {
        px += tag(d, px, y, st, C.success)
        if (px + 20 > pw - M) { px = M; y += 10 }
      }
      y += 14
    }

    if (s.crWk.length > 0) {
      if (y + 10 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }
      txt(d, C.danger); d.setFontSize(7); d.setFont("helvetica", "bold")
      d.text("Weaknesses", M, y)
      y += 5
      let px = M
      for (const w of s.crWk) {
        px += tag(d, px, y, w, C.danger)
        if (px + 20 > pw - M) { px = M; y += 10 }
      }
      y += 14
    }

    if (s.crMiss.length > 0) {
      if (y + 10 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }
      txt(d, C.warning); d.setFontSize(7); d.setFont("helvetica", "bold")
      d.text("Missing Skills", M, y)
      y += 5
      let px = M
      for (const ms of s.crMiss) {
        px += tag(d, px, y, ms, C.warning)
        if (px + 20 > pw - M) { px = M; y += 10 }
      }
      y += 14
    }
  }

  // Area Breakdown
  if (s.cra.length > 0) {
    if (y + 10 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }
    y = section(d, "Area Breakdown", y, M, pw)
    // Column headers
    txt(d, C.muted); d.setFontSize(6); d.setFont("helvetica", "bold")
    d.text("AREA", M, y + 2)
    d.text("SCORE", M + cw - 6, y + 2, { align: "right" })
    drw(d, C.border); d.setLineWidth(0.3)
    d.line(M, y + 4, M + cw, y + 4)
    y += 8
    for (const a of s.cra.slice(0, 6)) {
      if (y + 8 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }
      const ac = a.score >= 70 ? C.success : a.score >= 45 ? C.warning : C.danger
      txt(d, C.text); d.setFontSize(7.5); d.setFont("helvetica", "normal")
      d.text(a.area, M, y + 3)
      scoreBar(d, M + 52, y + 1, cw - 100, 5, a.score, ac)
      txt(d, ac); d.setFontSize(7.5); d.setFont("helvetica", "bold")
      d.text(`${Math.round(a.score)}%`, pw - M, y + 3, { align: "right" })
      y += 8
    }
    y += 4
  }

  // Final Verdict
  if (s.crv) {
    if (y + 16 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }
    const vl = d.splitTextToSize(s.crv, cw)
    fill(d, C.light); d.rect(M, y, cw, 12 + vl.length * 4.5, "F")
    txt(d, C.primary); d.setFontSize(7); d.setFont("helvetica", "bold")
    d.text("FINAL VERDICT", M + 4, y + 5)
    txt(d, C.text); d.setFontSize(7.5); d.setFont("helvetica", "italic")
    d.text(vl, M + 4, y + 11)
    y += 14 + vl.length * 4.5
  }

  // Recruiter Notes
  if (s.rr) {
    const rl = d.splitTextToSize(s.rr, cw)
    const rh = 12 + rl.length * 4.5
    if (y + rh + 4 > ph - 20) { addFooter(d, cp, TP, M, pw, ph); d.addPage(); cp++; pageBg(d, pw, ph); addHeader(d, M, pw); y = M + 22 }
    fill(d, C.light); d.rect(M, y, cw, rh, "F")
    txt(d, C.accent); d.setFontSize(7); d.setFont("helvetica", "bold")
    d.text("DETAILED RECRUITER NOTES", M + 4, y + 5)
    txt(d, C.text); d.setFontSize(7.5); d.setFont("helvetica", "normal")
    d.text(rl, M + 4, y + 11)
  }

  addFooter(d, cp, TP, M, pw, ph)
  return d
}
