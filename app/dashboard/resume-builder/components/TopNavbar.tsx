"use client";

import React from "react";

import Link from "next/link";
import { Button } from "@/components/ui/button";

import { Save, Download, RotateCcw, Settings } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// ... inside the component return

        

interface TopNavbarProps {
  html: string;
  setHtml: (html: string) => void;
  onReset: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  editorTheme: string;
  setEditorTheme: React.Dispatch<React.SetStateAction<string>>;
}

export default function TopNavbar({
  html,
  setHtml,
  onReset,
  zoom,
  setZoom,
  editorTheme,
  setEditorTheme,
}: TopNavbarProps) {
  // Dummy template list – UI only
  const templates = [
    { value: "default", label: "ATS Classic" },
    { value: "modern", label: "Modern" },
    { value: "minimal", label: "Minimal" },
    { value: "creative", label: "Creative" },
  ];

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));

  const toggleTheme = () =>
    setEditorTheme((prev) => (prev === "vs-dark" ? "light" : "vs-dark"));

  return (
    <header className="flex h-16 items-center bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2 mr-6">
        <img src="/logo.svg" alt="Mentorix" className="h-8 w-auto" />
        <span className="text-lg font-medium text-slate-200">Resume Builder</span>
      </Link>

      {/* Template selector */}
      <Select defaultValue="default">
        <SelectTrigger className="w-48 bg-slate-800 text-slate-200 border border-white/10 hover:bg-slate-700">
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border border-white/10 text-slate-200">
          {templates.map((t) => (
            <SelectItem key={t.value} value={t.value} className="hover:bg-slate-800">
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Zoom controls */}
      <div className="flex items-center space-x-2 text-slate-300">
        <Button variant="ghost" size="sm" onClick={handleZoomOut} className="text-slate-300 hover:text-slate-100">
          –
        </Button>
        <span className="text-sm">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={handleZoomIn} className="text-slate-300 hover:text-slate-100">
          +
        </Button>
      </div>

      {/* Action buttons – Save & PDF disabled */}
      <div className="flex items-center space-x-2 ml-4">
        <Button variant="secondary" disabled className="opacity-50 cursor-not-allowed">
          <Save className="h-4 w-4 mr-1" /> Save
        </Button>
        <Button variant="secondary" disabled className="opacity-50 cursor-not-allowed">
          <Download className="h-4 w-4 mr-1" /> PDF
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>
        <Button variant="ghost" onClick={toggleTheme}>
          {editorTheme === "vs-dark" ? "Dark" : "Light"}
        </Button>
        <Button variant="ghost">
          <Settings className="h-4 w-4" />
        </Button>

      </div>
    </header>
  );
}
