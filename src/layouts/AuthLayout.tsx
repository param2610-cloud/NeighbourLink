import React, { useEffect, ReactNode } from 'react';
import { useThemeContext } from '../contexts/ThemeContext'; // Import ThemeContext

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { theme } = useThemeContext(); // Access theme from context
  
  useEffect(() => {
    console.log("I am in AuthLayout");
  }, []);

  return (
    <>
      <div className={`flex w-full ${theme === 'dark' ? 'dark' : ''}`}>
        <div className='w-full'>
          {children}
        </div>
      </div>
    </>
  );
}

export default AuthLayout;