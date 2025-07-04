import type React from "react";
import { Header } from "./header";
import { Toaster } from "@/components/ui/toaster";

interface MainLayoutProps {
  children: React.ReactNode;
  activePage: string;
}

export function MainLayout({ children, activePage }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50/40">
      <Header activePage={activePage} />
      <main className="p-6">{children}</main>
      <Toaster />
    </div>
  );
}
