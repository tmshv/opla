import { proxy } from "valtio"

type OplaBox = {
    id: string
    position: [number, number, number]
    size: [number, number, number]
}

export type State = {
    target: string | null,
    items: OplaBox[],
}

export let state = proxy<State>({
    target: null,
    items: [
        {
            id: "1x 1y 1z",
            position: [0, 0, 0],
            size: [1, 1, 1],
        },
        {
            id: "2x 1y 1z",
            position: [0.5, 1, 0],
            size: [2, 1, 1],
        },
        {
            id: "1x 2y 1z",
            position: [0, 2.5, 0],
            size: [1, 2, 1],
        },
        {
            id: "1x 1y 2z",
            position: [2, 0, 0.5],
            size: [1, 1, 2],
        },
        {
            id: "1x 2y 3z",
            position: [2, 1.5, 1],
            size: [1, 2, 3],
        },
        {
            id: "2x 2y 4z",
            position: [4.5, 0.5, 1.5],
            size: [2, 2, 4],
        },
        {
            id: "3x 3y 3z",
            position: [8, 1, 1],
            size: [3, 3, 3],
        },
        {
            id: "4x 4y 4z",
            position: [8, 1, 1],
            size: [4, 4, 4],
        },
        {
            id: "cube",
            position: [0, 4, 0],
            size: [1, 1, 1],
        },
    ],
})

