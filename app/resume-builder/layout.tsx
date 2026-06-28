export default function ResumeBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200">
      {children}
    </div>
  );
}
