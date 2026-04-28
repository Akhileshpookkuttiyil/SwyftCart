'use client'
import React from 'react'
import { Spinner } from "@heroui/react";

const Loading = () => {
    return (
        <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
            <Spinner color="warning" size="lg" label="Loading..." />
            <p className="text-orange-600 font-medium">Please wait, SwyftCart is loading...</p>
        </div>
    )
}

export default Loading