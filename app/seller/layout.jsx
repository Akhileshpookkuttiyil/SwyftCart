'use client'
import Navbar from '@/components/seller/Navbar'
import Sidebar from '@/components/seller/Sidebar'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useClerk } from '@clerk/nextjs'
import { useUserStore } from '@/store/useUserStore'
import Loading from '@/components/Loading'
import { errorToast } from '@/lib/toast'

const Layout = ({ children }) => {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const { openSignIn } = useClerk()
  const isSeller = useUserStore((state) => state.isSeller)

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        openSignIn();
      } else if (!isSeller) {
        errorToast("You do not have seller permissions", "auth-error");
        router.push('/')
      }
    }
  }, [isSeller, isLoaded, isSignedIn, router, openSignIn])

  if (!isLoaded || !isSeller) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navbar />
      <div className='flex flex-1 overflow-hidden'>
        <Sidebar aria-label="Seller Sidebar" />
        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout