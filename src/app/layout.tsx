import "@/style.css"

import { Providers } from "@/components/providers"

export type RootLayoutProps = {
    children: React.ReactNode
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
    return (
        <html lang="en">
            <head>
                <title>Opla</title>
                <meta
                    name={"viewport"}
                    content={"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"}
                />
            </head>
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}

export default RootLayout
