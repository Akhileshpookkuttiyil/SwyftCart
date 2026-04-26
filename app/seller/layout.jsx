'use client'
import Navbar from '@/components/seller/Navbar'
import Sidebar from '@/components/seller/Sidebar'
import React, { useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'

const Layout = ({ children }) => {
  const { isSeller, isLoaded, isSignedIn } = useAppContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && (!isSignedIn || !isSeller)) {
      router.push('/')
    }
  }, [isSeller, isLoaded, isSignedIn, router])

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