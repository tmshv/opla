import { proxy } from "valtio"

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

export type State = {
    version: string
    items: Record<OplaId, OplaObject>
    scene: OplaId[]
}

export let state = proxy<State>({
    version: "1",
    scene: ["group-1", "3x3x3"],
    items: {
        "1x 1y 1z": {
            id: "1x 1y 1z",
            type: "box",
            position: [-0.5, -0.5, 0],
            size: [1, 1, 1],
        },
        "2x 1y 1z": {
            id: "2x 1y 1z",
            type: "box",
            position: [0, 0.5, 0],
            size: [2, 1, 1],
        },
        "3x3x3": {
            id: "3x3x3",
            type: "box",
            position: [8, 1, 2],
            size: [3, 3, 3],
        },
        "group-1": {
            id: "group-1",
            type: "group",
            position: [0.5, 0.5, 0],
            children: ["1x 1y 1z", "2x 1y 1z"],
        },
    },
})
