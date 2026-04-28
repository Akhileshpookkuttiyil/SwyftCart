'use client'
import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContext'
import Image from 'next/image'
import { useEffect } from 'react'
import { Spinner } from "@heroui/react"

const OrderPlaced = () => {

  const { router } = useAppContext()

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.push('/my-orders')
    }, 5000)

    return () => clearTimeout(timeoutId)
  }, [router])

  return (
    <div className='h-screen flex flex-col justify-center items-center gap-5'>
      <div className="flex justify-center items-center relative">
        <Image className="absolute p-5" src={assets.checkmark} alt='' />
        <Spinner color="success" className="h-24 w-24" />
      </div>
      <div className="text-center text-2xl font-semibold">Order Placed Successfully</div>
    </div>
  )
}

export default OrderPlaced
