import React from 'react'
import { assets } from '../../assets/assets'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const Navbar = () => {
  const router = useRouter()
  const { user } = useUser()

  return (
    <div className='flex items-center px-4 md:px-8 py-3 justify-between border-b bg-white'>
      <Image onClick={() => router.push('/')} className='w-28 lg:w-32 cursor-pointer' src={assets.logo} alt="SwyftCart Logo" />
      <div className="flex items-center gap-4">
        <div className="md:block hidden text-right">
          <p className="text-xs font-bold text-gray-900">{user?.fullName || 'Seller Dashboard'}</p>
          <p className="text-[10px] text-gray-400 capitalize">{user?.primaryEmailAddress?.emailAddress || 'Manage Store'}</p>
        </div>
        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center">
            {user?.imageUrl ? (
                <Image src={user.imageUrl} alt="Profile" width={36} height={36} className="w-full h-full object-cover" />
            ) : (
                <span className="text-xs font-bold text-gray-400">{user?.firstName?.charAt(0) || 'S'}</span>
            )}
        </div>
      </div>
    </div>
  )
}



export default Navbar