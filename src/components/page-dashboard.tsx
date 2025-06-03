import { useEffect } from "react"
import { useLoaderData, useNavigate } from "react-router"
import { Navigation } from "@/components/navigation"
import { reset } from "@/stores/opla"
import api, { OplaItem } from "@/api"
import { OplasList } from "@/components/oplas-list"
import NewModelButton from "./new-model-button"

const PageDashboard: React.FC = () => {
    const data = useLoaderData() as OplaItem[]
    const navigate = useNavigate()

    // Reset opla state to
    // TODO maybe better to reset on unmound editor page
    // will show name of loaded model without reset
    useEffect(() => {
        reset()
    }, [])

    return (
        <div className="w-full flex flex-col items-start gap-2">
            <Navigation blur showNewModelButton />
            <div className="px-8 mb-8 flex flex-col items-start gap-4">
                {!data.length ? null : (<>
                    <OplasList
                        items={data}
                        onDelete={async id => {
                            await api.deleteOpla(id)
                            navigate(".", { replace: true })
                        }}
                    />
                    <NewModelButton />
                </>)}
            </div>
        </div>
    )
}

export default PageDashboard
