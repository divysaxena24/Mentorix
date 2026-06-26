import React from 'react';
import Image from 'next/image';

type Props = {
  saveStatus: 'idle' | 'saving' | 'saved';
  onCompile: () => void;
  onDownloadPdf: () => void;
  onDownloadTex: () => void;
};

export default function TopToolbar({ saveStatus, onCompile, onDownloadPdf, onDownloadTex }: Props) {
  return (
    <header className="flex items-center justify-between h-12 px-4 bg-[#111827] text-white">
      <div className="flex items-center space-x-2">
        {/* Logo from public folder */}
        <img src="/mentorix-logo.svg" alt="Mentorix" width={24} height={24} />
        <span className="font-medium">Resume Builder</span>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm">
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
        </span>
        <button
          className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
          onClick={onCompile}
        >
          Compile
        </button>
        <button
          className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
          onClick={onDownloadPdf}
        >
          PDF
        </button>
        <button
          className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-5"
          onClick={onDownloadTex}
        >
          .tex
        </button>
      </div>
    </header>
  );
}
