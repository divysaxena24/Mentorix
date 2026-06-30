"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Save, 
  Download, 
  RotateCcw, 
  Settings, 
  FileText, 
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  Laptop
} from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface TopNavbarProps {
  html: string;
  setHtml: (html: string) => void;
  onReset: () => void;
  zoom: number | string;
  setZoom: (zoom: number | string) => void;
  editorTheme: string;
  setEditorTheme: React.Dispatch<React.SetStateAction<string>>;
  saveStatus: "saved" | "saving" | "unsaved";
  onSave: () => void;
  onExportPDF: () => void;
  onDownloadHTML: () => void;
  onPrint: () => void;
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
}

export default function TopNavbar({
  html,
  setHtml,
  onReset,
  zoom,
  setZoom,
  editorTheme,
  setEditorTheme,
  saveStatus,
  onSave,
  onExportPDF,
  onDownloadHTML,
  onPrint,
  selectedTemplate,
  setSelectedTemplate,
}: TopNavbarProps) {
  const templates = [
    { value: "default", label: "ATS Classic" },
    { value: "modern", label: "Modern Template" },
    { value: "minimal", label: "Minimalist Style" },
    { value: "creative", label: "Creative Layout" },
  ];

  const ZOOM_LEVELS = [0.5, 0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 2.0];

  const handleZoomIn = () => {
    const currentNum = typeof zoom === "number" ? zoom : 1.0;
    const next = ZOOM_LEVELS.find(z => z > currentNum + 0.01);
    setZoom(next ?? 2.0);
  };

  

  const handleZoomOut = () => {
    const currentNum = typeof zoom === "number" ? zoom : 1.0;
    const prev = [...ZOOM_LEVELS].reverse().find(z => z < currentNum - 0.01);
    setZoom(prev ?? 0.5);
  };

  const toggleTheme = () =>
    setEditorTheme((prev) => (prev === "vs-dark" ? "light" : "vs-dark"));

  return (
    <header className="flex h-14 items-center justify-between bg-slate-900 border-b border-slate-800 px-4 select-none shrink-0 z-50">
      {/* Left group */}
      <div className="flex items-center space-x-3">
        <Link href="/dashboard" className="flex items-center space-x-2 mr-2">
          <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
          <span className="text-sm font-semibold text-slate-100 tracking-wider">
            MENTORIX <span className="text-slate-400 font-normal">Resume</span>
          </span>
        </Link>

        <div className="h-4 w-[1px] bg-slate-800" />

        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger className="h-8 w-40 bg-slate-850 text-slate-200 border-slate-750 hover:bg-slate-800 hover:text-white transition-colors text-xs">
            <SelectValue placeholder="Choose Template" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
            {templates.map((t) => (
              <SelectItem key={t.value} value={t.value} className="hover:bg-slate-800 text-xs cursor-pointer">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Center group: Zoom Control */}
      <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-md border border-slate-800/40">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleZoomOut} 
          className="h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        
        <Select 
          value={
            zoom === "width" ? "width" : 
            zoom === "height" ? "height" : 
            zoom === "page" ? "page" : 
            `${Math.round((zoom as number) * 100)}%`
          } 
          onValueChange={(val) => {
            if (val === "width" || val === "height" || val === "page") {
              setZoom(val);
            } else {
              setZoom(parseFloat(val) / 100);
            }
          }}
        >
          <SelectTrigger className="h-7 w-32 bg-transparent text-slate-300 border-none hover:text-white text-xs text-center justify-center font-sans">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
            <SelectItem value="page" className="font-sans">Fit Page (Max Fit)</SelectItem>
            <SelectItem value="width" className="font-sans">Fit Width</SelectItem>
            <SelectItem value="height" className="font-sans">Fit Height</SelectItem>
            <div className="h-[1px] bg-slate-800 my-1" />
            <SelectItem value="50%" className="font-mono">50%</SelectItem>
            <SelectItem value="75%" className="font-mono">75%</SelectItem>
            <SelectItem value="90%" className="font-mono">90%</SelectItem>
            <SelectItem value="100%" className="font-mono">100%</SelectItem>
            <SelectItem value="110%" className="font-mono">110%</SelectItem>
            <SelectItem value="125%" className="font-mono">125%</SelectItem>
            <SelectItem value="150%" className="font-mono">150%</SelectItem>
            <SelectItem value="200%" className="font-mono">200%</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleZoomIn} 
          className="h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setZoom("page")} 
          className={`h-7 w-7 hover:bg-slate-800 ${zoom === "page" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"}`}
          title="Fit Entire Page (Max Fit)"
        >
          <Minimize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Right group */}
      <div className="flex items-center space-x-2">
        {/* Autosave Status Indicator */}
        <div className="text-[11px] text-slate-400 mr-2 flex items-center space-x-1.5 font-medium">
          <span className={`h-1.5 w-1.5 rounded-full ${
            saveStatus === "saving" ? "bg-amber-400 animate-pulse" :
            saveStatus === "saved" ? "bg-emerald-500" : "bg-red-400"
          }`} />
          <span>
            {saveStatus === "saving" ? "Saving..." :
             saveStatus === "saved" ? "Saved just now" : "Unsaved changes"}
          </span>
        </div>

        <Button 
          onClick={onSave}
          variant="secondary" 
          className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium border-none shadow-sm px-3"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" /> Save
        </Button>

        <Button 
          onClick={onExportPDF}
          variant="secondary" 
          className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-750 px-3"
        >
          <FileText className="h-3.5 w-3.5 mr-1.5" /> Export PDF
        </Button>

        <Button 
          onClick={onDownloadHTML}
          variant="ghost" 
          className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800 px-2"
          title="Download raw HTML file"
        >
          <Download className="h-3.5 w-3.5 mr-1" /> HTML
        </Button>

        <Button 
          onClick={onPrint}
          variant="ghost" 
          className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800 px-2"
          title="Print document"
        >
          <Laptop className="h-3.5 w-3.5 mr-1" /> Print
        </Button>

        <Button 
          onClick={onReset}
          variant="ghost" 
          className="h-8 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 px-2"
          title="Reset to default template"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme} 
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
          title="Toggle theme mode"
        >
          {editorTheme === "vs-dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
          title="Editor settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
