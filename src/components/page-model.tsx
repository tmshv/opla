import { useEffect } from "react"
import { OplaApp } from "@/components/opla-app"
import { useParams } from "react-router-dom"
import { Navigation } from "@/components/navigation"
import api from "@/api"
import { OplaPreview } from "@/components/opla-preview"
import { sync } from "@/app/opla"

const SyncOplaCover = () => {
    const { oplaId } = useParams()

    return (
        <OplaPreview onUpdate={async image => {
            const blobBin = atob(image.split(',')[1])
            const array = [];
            for (var i = 0; i < blobBin.length; i++) {
                array.push(blobBin.charCodeAt(i));
            }
            const file = new Blob([new Uint8Array(array)], { type: "image/png" })
            await api.updateCover(oplaId!, file)
        }} />
    )
}

const PageModel = () => {
    useEffect(() => {
        return sync()
    }, [])

    return (
        <>
            <OplaApp />
            <SyncOplaCover />
            <div className="absolute top-0 left-0 w-full">
                <Navigation />
            </div>
        </>
    )
}

export default PageModel
