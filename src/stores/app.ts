import { proxy } from "valtio"
import { V3 } from "./opla"

export const Tool = {
    SELECT: "SELECT",
    ADD: "ADD",
    DELETE: "DELETE",
    EXPORT: "EXPORT",
}

export type AppState = {
    synced: boolean
    tool: string
    orbitEnabled: boolean
    target: string | null
    targetSize: V3
    sceneId?: number
}

export default proxy<AppState>({
    synced: true,
    tool: Tool.SELECT,
    target: null,
    orbitEnabled: true,
    targetSize: [2, 2, 2],
    sceneId: undefined
})
