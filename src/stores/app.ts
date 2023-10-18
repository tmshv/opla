import { proxy } from "valtio"
import { V3 } from "./opla"

export const Tool = {
    SELECT: "SELECT",
    ADD: "ADD",
    DELETE: "DELETE",
    EXPORT: "EXPORT",
}

export type AppState = {
    tool: string,
    orbitEnabled: boolean
    target: string | null
    targetSize: V3
}

export default proxy<AppState>({
    tool: Tool.SELECT,
    target: null,
    orbitEnabled: true,
    targetSize: [2, 2, 2],
})
