'use client'
import Navbar from '@/components/seller/Navbar'
import Sidebar from '@/components/seller/Sidebar'
import React from 'react'

const Layout = ({ children }) => {
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