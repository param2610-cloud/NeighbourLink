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
            <div className="flex items-center space-x-2">
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
              type="checkbox"
              className="sr-only peer"
              checked={theme === 'dark'}
              onChange={toggleTheme}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:bg-gray-700 peer-checked:bg-blue-600 rounded-full peer dark:peer-focus:ring-blue-800"></div>
              <span className="absolute left-1 top-1 w-4 h-4 bg-gray-500 dark:bg-green-500 rounded-full transition-transform peer-checked:translate-x-5"></span>
            </label>
            </div>
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
