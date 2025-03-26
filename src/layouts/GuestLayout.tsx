import { useMobileContext } from '@/contexts/MobileContext';
import ThemeToggle from '@/ThemeToggle';
import React, { useEffect, ReactNode } from 'react'


interface GuestLayoutProps {
  children: ReactNode;
}

const GuestLayout: React.FC<GuestLayoutProps> = ({ children }) => {
  //   const navigate = useNavigate();
  const { isMini } = useMobileContext()
  useEffect(() => {
    console.log("I am in GuestLayout")
  })

  return (
    <>
      <div className={`flex w-full`}>
        {
          !isMini &&
          <div className='fixed bottom-4 right-4 z-50'>
            <ThemeToggle />
          </div>
        }

        <div className='w-full'>
          {/* <h3>GuestLayout</h3> */}
          {/* <Outlet /> */}
          {children}

        </div>

      </div>
    </>
  )
}

export default GuestLayout