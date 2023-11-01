import { useEffect } from "react"
import { useLoaderData, useNavigate } from "react-router-dom"
import { Navigation } from "@/components/navigation"
import { reset } from "@/stores/opla"
import api, { OplaItem } from "@/api"
import { OplasList } from "@/components/oplas-list"
import { Button } from "@nextui-org/react"

const PageDashboard: React.FC = () => {
    const data = useLoaderData() as OplaItem[]
    const navigate = useNavigate()

    // Reset opla state to
    // TODO maybe better to reset on unmound editor page
    useEffect(() => {
        reset()
    }, [])

    return (
        <>
            <div className="absolute top-0 left-0 w-full">
                <Navigation />
            </div>
            <div className="relative top-20 w-full px-8 flex flex-col items-start gap-4">
                <OplasList
                    items={data}
                    onDelete={async id => {
                        await api.deleteOpla(id)
                        navigate(".", { replace: true })
                    }}
                />
                <Button color="primary" onPress={async () => {
                    const item = await api.createNewOpla("Untitled")
                    navigate(`/${item.id}`)
                }}>
                    New
                </Button>

            </div>
        </>
    )
}

export default PageDashboard
