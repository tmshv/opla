import { proxy } from "valtio"

export enum Tool {
    SELECT,
    ADD,
    DELETE,
}

export type AppState = {
    tool: Tool,
    orbitEnabled: boolean
    target: string | null
}

export default proxy<AppState>({
    tool: Tool.SELECT,
    target: null,
    orbitEnabled: true,
})
