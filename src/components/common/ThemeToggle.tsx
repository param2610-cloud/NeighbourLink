import React from 'react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useStateContext } from '@/contexts/StateContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeContext();
  const { user } = useStateContext();

  return (
    <>
      {
        user ?
          <button
            onClick={toggleTheme}
            className="p-2 rounded w-full bg-transparent items-center flex justify-center"
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          :
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full h-12 w-12 items-center bg-gray-700 dark:bg-gray-200 flex justify-center"
          >
            {theme === 'dark' ? '🌞' : '🌚'}
          </button>
      }
    </>
  );
}

export default ThemeToggle;
