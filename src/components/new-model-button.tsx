import api from "@/api"
import { Button } from "@nextui-org/react"
import { useNavigate } from "react-router"

const NewModelButton = () => {
    const navigate = useNavigate()

    return (
        <Button color="primary" size="sm" onPress={async () => {
            const count = await api.countOplas()
            const location = await api.newOpla(`Untitled ${count + 1}`)
            navigate(location)
        }}>
            New
        </Button>
    )
}

export default NewModelButton
