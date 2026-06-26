'use client';

import React from 'react';
import MonacoEditor from '@monaco-editor/react';

type Props = {
  content: string;
  onChange: (value: string) => void;
  height?: string;
};

export default function EditorPane({ content, onChange, height = '100%' }: Props) {
  return (
    <div className="w-1/2 h-full bg-[#0f172a] text-white">
      <MonacoEditor
        height={height}
        language="latex"
        theme="vs-dark"
        value={content}
        options={{
          automaticLayout: true,
          wordWrap: 'on',
          minimap: { enabled: false },
          lineNumbers: 'on',
          bracketPairColorization: { enabled: true },
          formatOnType: true,
        }}
        onChange={(value) => onChange(value ?? '')}
      />
    </div>
  );
}
