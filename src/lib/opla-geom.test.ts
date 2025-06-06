import { Box3, Vector3 } from "three"
import type { OplaBox } from "@/stores/opla"
import { oplaItemToBox3, sizeToBox3 } from "./opla-geom"

describe("oplaItemToBox3", () => {
    test("should return correct Box3", () => {
        const item: OplaBox = {
            id: "cube",
            type: "box",
            position: [0, 4, 0],
            size: [1, 1, 1],
        }
        const result = new Box3(new Vector3(-0.5, 3.5, -0.5), new Vector3(0.5, 4.5, 0.5))
        expect(oplaItemToBox3(item)).toEqual(result)
    })
})

describe("sizeToBox3", () => {
    test("should return correct Box3", () => {
        const item: OplaBox = {
            id: "cube",
            type: "box",
            position: [0, 4, 0],
            size: [1, 1, 1],
        }
        const result = new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5))
        expect(sizeToBox3(item.size)).toEqual(result)
    })
})
