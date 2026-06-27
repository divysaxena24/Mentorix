"use client";

import React, { useState, useEffect, useCallback } from "react";
import TopNavbar from "./components/TopNavbar";
import MonacoEditor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";



const DEFAULT_TEMPLATE_URL = "/templates/default_resume.html";
const LOCAL_STORAGE_KEY = "mentorix_resume_html";

function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function ResumeBuilderClient() {
  const [html, setHtml] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1);
  const [editorTheme, setEditorTheme] = useState<string>("vs-dark");

  // Load saved or default template
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setHtml(saved);
    } else {
      fetch(DEFAULT_TEMPLATE_URL)
        .then((r) => r.text())
        .then((t) => setHtml(t))
        .catch(() => setHtml("<div>No template found</div>"));
    }
  }, []);

  // Autosave (debounced)
  const saveToLocal = useCallback(
    debounce((content: string) => {
      localStorage.setItem(LOCAL_STORAGE_KEY, content);
    }, 1000),
    []
  );

  useEffect(() => {
    if (html) saveToLocal(html);
  }, [html, saveToLocal]);

  const handleEditorChange = (value?: string) => {
    if (value !== undefined) setHtml(value);
  };

  const resetTemplate = () => {
    fetch(DEFAULT_TEMPLATE_URL)
      .then((r) => r.text())
      .then((t) => setHtml(t))
      .catch(() => setHtml("<div>No template found</div>"));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      <header className="flex items-center h-14 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4">
        <Link href="/dashboard" className="flex items-center space-x-2 text-slate-200 hover:text-white">
          <ChevronLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </Link>
      </header>
<TopNavbar
  html={html}
  setHtml={setHtml}
  onReset={resetTemplate}
  zoom={zoom}
  setZoom={setZoom}
  editorTheme={editorTheme}
  setEditorTheme={setEditorTheme}
/>
      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={50} minSize={30} maxSize={70} className="bg-slate-900 border-r border-white/10">
          <MonacoEditor
            height="100%"
            defaultLanguage="html"
            theme={editorTheme}
            value={html}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: true },
              lineNumbers: "on",
              automaticLayout: true,
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </Panel>
        <PanelResizeHandle className="w-1 bg-white/10 cursor-col-resize hover:bg-white/30 transition-colors" />
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="h-full w-full flex items-center justify-center bg-gray-200 overflow-auto relative">
            <iframe
              title="Resume Preview"
              srcDoc={html}
              className="bg-white shadow-lg absolute inset-0"
              style={{
                width: `${210 * zoom}mm`,
                height: `${297 * zoom}mm`,
                border: "none",
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
