import React, { useState, useEffect } from 'react';

const ThemeToggle: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  useEffect(() => {
    // Check initial theme preference
    if (localStorage.theme === 'dark' || 
       (!('theme' in localStorage) && 
        window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, []);
  
  const toggleDarkMode = (): void => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setDarkMode(true);
    }
  };
  
  return (
    <button 
      onClick={toggleDarkMode} 
      className="p-2 rounded-full h-12 w-12 items-center  bg-gray-700 dark:bg-gray-200 flex justify-center items-centerx  "
    >
      {darkMode ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeToggle;