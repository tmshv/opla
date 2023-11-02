import { Spinner } from "@nextui-org/react"
import useSyncing from "@/hooks/use-syncing"

const SyncSpinner: React.FC = () => {
    const synced = useSyncing()
    if (synced) {
        return null
    }
    return (
        <Spinner color="white" size="sm" />
    )
}

export default SyncSpinner
