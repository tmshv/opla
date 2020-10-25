import { runApp } from "@/app"
import { NextPage } from "next"
import { useEffect, useRef } from "react"

const Page: NextPage = () => {
    const ref = useRef<HTMLDivElement>()

    useEffect(() => {
        runApp(ref.current)
    })

    return (
        <div ref={ref}/>
    )
}

export default Page
