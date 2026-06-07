"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FeedbackButton from "@/components/FeedbackButton";
import FeedbackModal from "@/components/FeedbackModal";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 64 }}>{children}</main>
      <Footer onFeedback={() => setFeedbackOpen(true)} />
      <FeedbackButton onClick={() => setFeedbackOpen(true)} />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
