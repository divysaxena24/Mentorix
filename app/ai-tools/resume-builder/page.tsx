'use client';
import React, { useState, useEffect } from 'react';
import EditorPane from './components/EditorPane';
import PdfPreviewPane from './components/PdfPreviewPane';
import TopToolbar from './components/TopToolbar';

export default function ResumeBuilderPage() {
  const [texContent, setTexContent] = useState<string>('');
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [compiling, setCompiling] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [compileError, setCompileError] = useState<string | null>(null);

  // Load initial content from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('resume-tex');
    if (saved) setTexContent(saved);
  }, []);

  // Autosave on change (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (texContent) {
        localStorage.setItem('resume-tex', texContent);
        setSaveStatus('saved');
      }
    }, 800);
    return () => clearTimeout(handler);
  }, [texContent]);

  const compile = async () => {
    setCompiling(true);
    setCompileError(null);
    try {
      const response = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tex: texContent }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Compilation failed');
      }
      // Convert base64 string to Uint8Array
      const binary = atob(data.pdf);
      const uint8 = Uint8Array.from(binary, c => c.charCodeAt(0));
      setPdfData(uint8);
    } catch (err) {
      setCompileError(err instanceof Error ? err.message : String(err));
    } finally {
      setCompiling(false);
    }
  };

  // Download PDF handler
  const downloadPdf = () => {
    if (!pdfData) return;
// @ts-ignore – TypeScript sometimes flags Uint8Array.buffer as incompatible with BlobPart
    const blob = new Blob([pdfData.buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };


  // Download TEX handler
  const downloadTex = () => {
    const blob = new Blob([texContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.tex';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render error message if compilation fails
  const compileErrorMessage = compileError ? (
    <p className="text-red-500 p-2 bg-gray-800">{compileError}</p>
  ) : null;


  return (
    <div className="flex flex-col h-screen bg-[#111827] text-white">
      <TopToolbar
        saveStatus={saveStatus}
        onCompile={compile}
        onDownloadPdf={downloadPdf}
        onDownloadTex={downloadTex}
      />
      {compileErrorMessage}
      <div className="flex flex-1 overflow-hidden">
        <EditorPane
          content={texContent}
          onChange={setTexContent}
          height="100%"
        />
        <div className="w-0.5 bg-gray-700" />
        <div className="flex-1 overflow-auto bg-[#d9d9d9] flex items-center justify-center">
            {pdfData ? (
              <PdfPreviewPane pdfData={pdfData} />
            ) : (
              <p className="text-gray-600">PDF preview will appear here</p>
            )}
        </div>
      </div>
    </div>
  );
}
