# 📋 Project Requirements - Mentorix

## 1. Vision
Mentorix aims to be the ultimate AI-orchestrated navigation system for modern professionals. It combines high-performance editing tools with deep-learning insights to bridge the gap between candidate potential and job market requirements.

## 2. Functional Requirements

### 🛠️ Neural Resume Architect
- **R1.1**: Provide a resizable, three-pane workspace (Layout/Editor/Preview).
- **R1.2**: Support real-time synchronization between data input and preview.
- **R1.3**: Implement a responsive mini-sidebar for high-density document navigation.
- **R1.4**: Enable high-fidelity PDF generation with professional typography.

### 🤖 AI Career Orchestration
- **R2.1**: AI Career Coach must provide real-time, context-aware advice using high-speed LLMs (Groq).
- **R2.2**: Support resume analysis against specific Job URLs or descriptions.
- **R2.3**: Generate an ATS (Applicant Tracking System) compatibility score with a minimum breakdown of 5 categories (Skills, Experience, formatting, etc.).
- **R2.4**: Generate personalized learning roadmaps with milestones and course recommendations.

### 📋 Data & History
- **R3.1**: Secure user authentication and profile management via Clerk.
- **R3.2**: Maintain a 'Neural Archive' (History) for all generated roadmaps, resumes, and chat sessions.
- **R3.3**: Allow users to delete their history data permanently.

## 3. Non-Functional Requirements

### 🚄 Performance
- **NF1.1**: AI responses should initiate in under 2 seconds (leveraging Groq LPU).
- **NF1.2**: PDF generation and download should complete in under 5 seconds.
- **NF1.3**: The UI must maintain 60 FPS during resizing and transitions.

### 🎨 User Experience (UX)
- **NF2.1**: Follow a "Premium Dark" aesthetic with Glassmorphism effects.
- **NF2.2**: Mobile responsiveness for dashboard and history views.
- **NF2.3**: Accessibility support for interactive elements.

## 4. Technical Constraints
- **C1**: Must use Next.js 16 (App Router) as the core framework.
- **C2**: Database operations must be handled via Drizzle ORM and Neon PostgreSQL.
- **C3**: Background tasks (like course generation) must use Inngest for reliability.
