import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsBadgeProps {
  icon: LucideIcon;
  label: string;
}

export const StatsBadge: React.FC<StatsBadgeProps> = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white">
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </div>
);
