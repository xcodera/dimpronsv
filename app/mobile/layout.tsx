// Fix: Added import for React to resolve error when using React.ReactNode type.
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from 'next/link';
import BottomNav from "./_components/bottom-nav";
import { ThemeProvider } from "./_components/theme-provider";

export default async function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen max-w-md mx-auto overflow-hidden relative shadow-2xl transition-colors duration-300 bg-[#0f172a]">
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {children}
        </main>
        <BottomNav />
      </div>
    </ThemeProvider>
  );
}