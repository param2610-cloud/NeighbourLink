import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface MobileContextType {
  isMobile: boolean;
  setMobile: (value: boolean) => void;
}

const MobileContext = createContext<MobileContextType>({
  isMobile: false,
  setMobile: () => {},
});

interface MobileProviderProps {
  children: ReactNode;
}

export const MobileProvider = ({ children }: MobileProviderProps) => {
  const [isMobile, setMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setMobile(window.innerWidth < 510);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile, setMobile }}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobileContext = () => useContext(MobileContext);