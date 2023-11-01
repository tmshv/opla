import { useSnapshot } from "valtio"
import state from "@/stores/app"

export default function useSyncing() {
    const { synced } = useSnapshot(state)
    return synced
}
