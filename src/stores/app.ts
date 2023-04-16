import { proxy } from "valtio"

export type AppState = {
    orbitEnabled: boolean
    target: string | null
}

export default proxy<AppState>({
    target: null,
    orbitEnabled: true,
})
