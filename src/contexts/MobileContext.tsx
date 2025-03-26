import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface MobileContextType {
  isMobile: boolean;
  setMobile: (value: boolean) => void;
  isMini:boolean;
  setMini:(value:boolean)=>void;
  isMiniHeight:boolean;
  setMiniHeight:(value:boolean)=>void;
}

const MobileContext = createContext<MobileContextType>({
  isMobile: false,
  setMobile: () => {},
  isMini:false,
  setMini:()=>{},
  isMiniHeight:false,
  setMiniHeight:()=>{}
});

interface MobileProviderProps {
  children: ReactNode;
}

export const MobileProvider = ({ children }: MobileProviderProps) => {
  const [isMobile, setMobile] = useState(false);
  const [isMini, setMini] = useState(false);
  const [isMiniHeight, setMiniHeight]= useState(false);

  useEffect(() => {
    const handleResize = () => {
      setMobile(window.innerWidth < 510);
      setMini(window.innerWidth < 384);
      setMiniHeight(window.innerHeight < 598);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile, setMobile, isMini, setMini, isMiniHeight, setMiniHeight }}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobileContext = () => useContext(MobileContext);