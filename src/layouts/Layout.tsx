import ThemeToggle from '@/components/common/ThemeToggle';
import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <header className="p-4 bg-gray-100 dark:bg-gray-800 flex justify-between">
        <h1 className="text-gray-900 dark:text-white text-xl font-bold">My App</h1>
        <ThemeToggle />
      </header>
      <main className="p-4 text-gray-900 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
}

export default Layout;