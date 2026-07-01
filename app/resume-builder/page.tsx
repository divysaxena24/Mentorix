"use client";

import { useEffect } from "react";
import ResumeBuilderClient from "./ResumeBuilderClient";

export default function ResumeBuilderPage() {
  useEffect(() => {
    document.title = "Resume Builder • Mentorix";
  }, []);

  return <ResumeBuilderClient />;
}
