import { useMedia } from "react-use"

export function useDarkTheme() {
    return useMedia("(prefers-color-scheme: dark)", false)
}

