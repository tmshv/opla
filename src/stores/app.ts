import { proxy } from "valtio"

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
}

export default proxy<AppState>({
    tool: Tool.SELECT,
    target: null,
    orbitEnabled: true,
})
