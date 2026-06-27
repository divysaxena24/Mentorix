"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ResumeJSON, SectionItem } from '../../types/resume';
import { v4 as uuidv4 } from 'uuid';

interface ResumeContextProps {
  resume: ResumeJSON;
  updateResume: (partial: Partial<ResumeJSON>) => void;
  addSectionItem: (section: keyof ResumeJSON, item: Omit<SectionItem, 'id'>) => void;
  updateSectionItem: (section: keyof ResumeJSON, id: string, updates: Partial<SectionItem>) => void;
  removeSectionItem: (section: keyof ResumeJSON, id: string) => void;
  reorderSections: (newOrder: string[]) => void;
}

const defaultResume: ResumeJSON = {
  personalInfo: {},
  summary: '',
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certifications: [],
  achievements: [],
  languages: [],
  interests: [],
  customSections: [],
  sectionOrder: ['personalInfo', 'summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'achievements', 'languages', 'interests', 'customSections'],
  template: 'classic',
  theme: {
    darkMode: true,
    accentColor: '#4F46E5',
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 1.5,
    sectionSpacing: 12,
    pageMargin: 24,
    headerStyle: 'compact',
  },
};

const ResumeContext = createContext<ResumeContextProps | undefined>(undefined);

export const useResume = (): ResumeContextProps => {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used within ResumeProvider');
  return ctx;
};

interface ProviderProps {
  children: ReactNode;
}

export const ResumeProvider: React.FC<ProviderProps> = ({ children }) => {
  const [resume, setResume] = useState<ResumeJSON>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('resume-data');
      if (stored) return JSON.parse(stored) as ResumeJSON;
    }
    return defaultResume;
  });

  // persist on change
  useEffect(() => {
    localStorage.setItem('resume-data', JSON.stringify(resume));
  }, [resume]);

  const updateResume = (partial: Partial<ResumeJSON>) => {
    setResume(prev => ({ ...prev, ...partial }));
  };

  const addSectionItem = (section: keyof ResumeJSON, item: Omit<SectionItem, 'id'>) => {
    const newItem = { ...item, id: uuidv4() } as SectionItem;
    setResume(prev => {
      const arr = Array.isArray((prev as any)[section]) ? [...(prev as any)[section]] : [];
      (arr as SectionItem[]).push(newItem);
      return { ...prev, [section]: arr } as ResumeJSON;
    });
  };

  const updateSectionItem = (section: keyof ResumeJSON, id: string, updates: Partial<SectionItem>) => {
    setResume(prev => {
      const arr = Array.isArray((prev as any)[section]) ? (prev as any)[section].map((it: SectionItem) => (it.id === id ? { ...it, ...updates } : it)) : [];
      return { ...prev, [section]: arr } as ResumeJSON;
    });
  };

  const removeSectionItem = (section: keyof ResumeJSON, id: string) => {
    setResume(prev => {
      const arr = Array.isArray((prev as any)[section]) ? (prev as any)[section].filter((it: SectionItem) => it.id !== id) : [];
      return { ...prev, [section]: arr } as ResumeJSON;
    });
  };

  const reorderSections = (newOrder: string[]) => {
    setResume(prev => ({ ...prev, sectionOrder: newOrder }));
  };

  return (
    <ResumeContext.Provider
      value={{ resume, updateResume, addSectionItem, updateSectionItem, removeSectionItem, reorderSections }}
    >
      {children}
    </ResumeContext.Provider>
  );
};
