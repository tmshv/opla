import { nextui } from "@nextui-org/react"

/** @type {import('tailwindcss').Config} */
const config = {
    content: [
        "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    // purge: [
    //     "./src/components/**/*.{js,ts,jsx,tsx}",
    //     "./pages/**/*.{js,ts,jsx,tsx}",
    // ],
    theme: {
        extend: {
            colors: {
                // "accent-1": "#333",
            },
        },
    },
    darkMode: "class",
    plugins: [nextui()],
}

export default config
