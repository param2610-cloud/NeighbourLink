import ThemeToggle from '@/ThemeToggle';
import React, { useEffect, ReactNode } from 'react'


interface GuestLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<GuestLayoutProps> = ({ children }) => {
 useEffect(()=>{
     console.log("I am in AuthLayout")
 })
  return (
    <>
      <div className={`flex w-full`}>
       
          <div className='fixed bottom-4 right-4 z-50'>
          <ThemeToggle/>
          </div>
          <div className='w-full'>
            {/* <h3>GuestLayout</h3> */}
            {/* <Outlet /> */}
            
            {children}
            
          </div>
        
      </div>
    </>
  )
}

export default AuthLayout