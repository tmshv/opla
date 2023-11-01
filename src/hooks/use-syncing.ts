import { useSnapshot } from "valtio"
import app from "@/stores/app"

export default function useSyncing() {
    const { synced } = useSnapshot(app)
    return synced
}
