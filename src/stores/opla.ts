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

export type State = OplaModelData

export let state = proxyWithHistory<State>({
    version: "1",
    scene: [
        "2x2x2-0",
        "2x2x2-1",
        "2x2x2-2",
        // "3x3x3",
    ],
    items: {
        "2x2x2-0": {
            id: "2x2x2-0",
            type: "box",
            position: [0.5, 0.5, 0.5],
            size: [2, 2, 2],
        },
        "2x2x2-1": {
            id: "2x2x2-1",
            type: "box",
            position: [0.5, 2.5, 0.5],
            size: [2, 2, 2],
        },
        "2x2x2-2": {
            id: "2x2x2-2",
            type: "box",
            position: [0.5, 4.5, 0.5],
            size: [2, 2, 2],
        },
        "3x3x3": {
            id: "3x3x3",
            type: "box",
            position: [6, 1, 1],
            size: [3, 3, 3],
        },
        // "group-1": {
        //     id: "group-1",
        //     type: "group",
        //     position: [0, 0, 0],
        //     children: ["2x2x2-0"],
        // },
    },
})
