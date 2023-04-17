import { proxy } from "valtio"

export type OplaId = string
export type OplaGroup = {
    id: OplaId
    type: "group"
    position: [number, number, number]
    boxIds: OplaId[]
}

export type OplaBox = {
    id: OplaId
    type: "box"
    position: [number, number, number]
    size: [number, number, number]
}

export type OplaItem = OplaBox | OplaGroup

export type State = {
    // target: string | null,
    items: Record<OplaId, OplaItem>
    rootIds: OplaId[]
}

export let state = proxy<State>({
    // target: null,
    items: {
        "1x 1y 1z": {
            id: "1x 1y 1z",
            type: "box",
            position: [0, 0, 0],
            size: [1, 1, 1],
        },
        "2x 1y 1z": {
            id: "2x 1y 1z",
            type: "box",
            position: [0, 1, 0],
            size: [1, 1, 1],
        },
        "cube-1": {
            id: "cube",
            type: "box",
            position: [0, 4, 0],
            size: [1, 1, 1],
        },
        "cube-2": {
            id: "cube-2",
            type: "box",
            position: [1, 4, 0],
            size: [1, 1, 1],
        },
        "cube-3": {
            id: "cube-3",
            type: "box",
            position: [2, 4, 0],
            size: [1, 1, 1],
        },
        "cube-4": {
            id: "cube-4",
            type: "box",
            position: [3, 4, 0],
            size: [1, 1, 1],
        },
        "group-1": {
            id: "group-1",
            type: "group",
            position: [0, 1, 0],
            boxIds: ["1x 1y 1z", "2x 1y 1z"],
        },
        "group-2": {
            id: "group-2",
            type: "group",
            position: [0, 1, 0],
            boxIds: ["cube-1", "cube-2", "cube-3", "cube-4"],
        },
    },
    rootIds: ["group-1", "group-2"],

    // items: [
    // {
    //     id: "1x 2y 1z",
    //     position: [0, 2.5, 0],
    //     size: [1, 2, 1],
    // },
    // {
    //     id: "1x 1y 2z",
    //     position: [2, 0, 0.5],
    //     size: [1, 1, 2],
    // },
    // {
    //     id: "1x 2y 3z",
    //     position: [2, 1.5, 1],
    //     size: [1, 2, 3],
    // },
    // {
    //     id: "2x 2y 4z",
    //     position: [4.5, 0.5, 1.5],
    //     size: [2, 2, 4],
    // },
    // {
    //     id: "3x 3y 3z",
    //     position: [8, 1, 1],
    //     size: [3, 3, 3],
    // },
    // {
    //     id: "4x4x4",
    //     position: [1.5, 1.5, 7.5],
    //     size: [4, 4, 4],
    // },
    // ],
})
