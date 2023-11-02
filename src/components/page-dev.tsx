import { useEffect } from "react"
import { OplaApp } from "@/components/opla-app"
import { reset } from "@/stores/opla"

const PageDev = () => {
    useEffect(() => {
        reset()
    }, [])

    return (
        <div className="overflow-hidden w-full h-full">
            <OplaApp />
        </div>
    )
}

export default PageDev
