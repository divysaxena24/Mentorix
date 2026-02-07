# 🚀 Mentorix - AI Career Coach Platform

**Mentorix** is an intelligent AI-powered career coaching platform designed to help professionals navigate their career journey with personalized guidance, resume analysis, and custom AI agents.

---

## ✨ Features

### 🎯 Core Features

- **AI Career Coach** - Get personalized career guidance powered by advanced AI
- **Resume Analyzer** - Upload and analyze your resume for actionable insights and improvements
- **Career Roadmap Generator** - Generate customized career paths based on your goals and experience
- **Career Q&A System** - Ask questions and get expert career guidance instantly
- **AI Agent Builder** - Create and customize your own AI agents with visual workflow builder

### 🤖 AI Agent Builder

Build custom AI agents with a visual node-based interface:
- **Drag-and-drop workflow builder** using React Flow
- **Multiple node types**: LLM nodes, tool integrations, conditional logic
- **Tool integrations**: Weather API, web search, and custom tools
- **Agent management**: Create, edit, star, and organize your agents
- **Real-time preview** and testing

### 🎨 Modern UI/UX

- Premium dark theme with cyan/blue gradients
- Glassmorphism effects and smooth animations
- Fully responsive design
- Optimized for performance

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Workflow Builder**: React Flow
- **Animations**: Framer Motion

### Backend & Database
- **Database**: Drizzle ORM with PostgreSQL
- **Authentication**: [Clerk](https://clerk.dev/)
- **AI Integration**: Google Gemini API
- **Email**: Nodemailer (OTP verification)

### Tools & APIs
- Weather API integration
- File upload and processing
- Real-time chat interface

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- Clerk account for authentication
- Google Gemini API key

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Mentorix/mentorix
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory with the following:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database
DATABASE_URL=your_postgresql_connection_string

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Email (Nodemailer)
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password

# Weather API (optional)
WEATHER_API_KEY=your_weather_api_key
```

4. **Run database migrations**
```bash
npm run db:push
# or use your preferred migration command
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
mentorix/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages (sign-in, sign-up)
│   ├── (root)/            # Main application pages
│   │   ├── dashboard/     # User dashboard
│   │   ├── ai-agents/     # AI agents management
│   │   ├── builder/       # Agent builder interface
│   │   └── pricing/       # Pricing page
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature-specific components
├── configs/              # Configuration files
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── public/               # Static assets
└── drizzle.config.ts     # Database configuration
```

---

## 🚀 Usage

### Creating Your First AI Agent

1. Navigate to **AI Agents** page
2. Click **Create New Agent**
3. Use the visual builder to:
   - Add LLM nodes for AI processing
   - Connect tool nodes (weather, search, etc.)
   - Configure agent settings
4. Save and test your agent
5. Star your favorite agents for quick access

### Analyzing Your Resume

1. Go to **Resume Analyzer**
2. Upload your resume (PDF/DOCX)
3. Get instant AI-powered feedback
4. Download improvement suggestions

### Generating Career Roadmaps

1. Access **Career Roadmap Generator**
2. Input your current role and target position
3. Receive a personalized step-by-step career path
4. Track your progress over time

---

## 🔐 Authentication

Mentorix uses [Clerk](https://clerk.dev/) for secure authentication:
- Email/password sign-up
- Social login (Google, GitHub, etc.)
- OTP email verification for contact forms
- Protected routes with middleware

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Clerk](https://clerk.dev/) - Authentication
- [Google Gemini](https://ai.google.dev/) - AI capabilities
- [React Flow](https://reactflow.dev/) - Workflow builder

---

## 📧 Contact

For questions or support, please open an issue or contact the maintainer.

---

**Built with ❤️ by DIVY**
