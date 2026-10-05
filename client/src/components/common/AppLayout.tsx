import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import { FloatingChatbot } from '../ai/FloatingChatbot';
import { AuthModal } from '../auth/AuthModal';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Fixed Dark Navy Sidebar */}
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />

      {/* Main App Canvas */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        
        <main className="flex-1 pb-20 lg:pb-12">
          {children}
        </main>

        {/* Global Accessible Auth Modal (Login / Sign Up / Forgot Password) */}
        <AuthModal />

        {/* Floating AI Chatbot Assistant */}
        <FloatingChatbot />

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};
