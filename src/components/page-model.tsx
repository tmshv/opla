import { useEffect } from "react"
import { OplaApp } from "@/components/opla-app"
import { useParams } from "react-router"
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
        <div className="overflow-hidden w-full h-full">
            <OplaApp />
            <div className="opacity-0" style={{
                width: 500,
                height: 500,
            }}>
                <SyncOplaCover />
            </div>
            <div className="absolute top-0 left-0 w-full">
                <Navigation />
            </div>
        </div>
    )
}

export default PageModel
