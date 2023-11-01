import { proxyWithHistory } from "valtio/utils"

export type V3 = [number, number, number]
export type OplaId = string

export type OplaBox = {
    id: OplaId
    type: "box"
    position: V3
    size: V3
}

export type OplaGroup = {
    id: OplaId
    type: "group"
    position: V3
    children: OplaId[]
}

export type OplaObject =
    | OplaBox
    | OplaGroup

export type OplaObjectCollection = Record<OplaId, OplaObject>

export type OplaModelData = {
    version: string
    items: OplaObjectCollection
    scene: OplaId[]
}

export type State = {
    name: string
    model: OplaModelData
}

let state = proxyWithHistory<State>({
    name: "",
    model: {
        version: "1",
        scene: [],
        items: {},
    }
})

export function reset() {
    state.value = {
        name: "New",
        model: {
            version: "1",
            scene: [],
            items: {},
        }
    }
}

export default state
