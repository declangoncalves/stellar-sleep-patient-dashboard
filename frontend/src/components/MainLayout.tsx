// frontend/src/components/Layout.tsx
'use client';

import { ReactNode } from 'react';
// import Link from "next/link";
import { Sidebar } from './Sidebar/Sidebar';
import { Navbar } from './Navbar/Navbar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex-shrink-0 bg-white border-r transition-all w-32">
        <Sidebar collapsed={false} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Top navbar */}
        <header className="bg-white border-b shadow-sm">
          <Navbar />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 bg-white">{children}</main>
      </div>
    </div>
  );
}
