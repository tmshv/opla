"use client"

import { NextUIProvider } from "@nextui-org/react"

export type ProvidersProps = {
    children: React.ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <NextUIProvider>
            {children}
        </NextUIProvider>
    )
}

