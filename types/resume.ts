export interface PersonalInfo {
  fullName?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  location?: string;
}

export interface SectionItem {
  id: string; // uuid
  title?: string;
  description?: string;
  startDate?: string; // ISO
  endDate?: string;
  // generic fields for any custom section
  [key: string]: any;
}

export interface ResumeJSON {
  personalInfo: PersonalInfo;
  summary?: string;
  education: SectionItem[];
  experience: SectionItem[];
  projects: SectionItem[];
  skills: string[];
  certifications: SectionItem[];
  achievements: SectionItem[];
  languages: string[];
  interests: string[];
  customSections: SectionItem[];
  sectionOrder: string[]; // array of section keys in desired order
  template: string; // e.g., "ats-classic"
  theme: {
    accentColor?: string;
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    sectionSpacing?: number;
    pageMargin?: number;
    headerStyle?: string;
    darkMode?: boolean;
  };
}
