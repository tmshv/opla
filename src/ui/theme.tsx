import { NextUIProvider } from "@nextui-org/react"

export type ThemeProps = {
    children: React.ReactNode
}

const Theme: React.FC<ThemeProps> = ({ children }) => {
    return (
        <NextUIProvider>
            {children}
        </NextUIProvider>
    )
}

export default Theme
