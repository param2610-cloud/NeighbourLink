import { isUserRegistered } from '@/utils/communities/CheckIfRegisterd'
import React, { useEffect, useState } from 'react'

const skillSharing = () => {

    async function name(params:type) {
        
    }

    const [isUserRegistered,setisUserRegistered] = useState<boolean>(false);

    useEffect(() => {
        setisUserRegistered(await isUserRegistered())

    }, [])
    
  return (
    <div>skillSharing</div>
  )
}

export default skillSharing