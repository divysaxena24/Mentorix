import React from 'react';
import { useResume } from '@/components/resume/ResumeProvider';

const sections = [
  'personalInfo',
  'summary',
  'education',
  'experience',
  'projects',
  'skills',
  'certifications',
  'achievements',
  'languages',
  'interests',
  'customSections',
];

export const Sidebar: React.FC = () => {
  const { resume, reorderSections } = useResume();
  const activeSection = resume.sectionOrder[0]; // placeholder

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.dataTransfer.setData('text/plain', idx.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const newOrder = [...resume.sectionOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(idx, 0, moved);
    reorderSections(newOrder);
  };

  return (
    <div className="sidebar" style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Sections</h3>
      <div>
        {resume.sectionOrder.map((key, idx) => (
          <div
            key={key}
            draggable
            onDragStart={e => handleDragStart(e, idx)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, idx)}
            style={{
              padding: '0.5rem 0.75rem',
              marginBottom: '0.5rem',
              borderRadius: '0.4rem',
              background: key === activeSection ? 'rgba(255,255,255,0.1)' : 'transparent',
              cursor: 'grab',
            }}
          >
            {key}
          </div>
        ))}
      </div>
    </div>
  );
};
