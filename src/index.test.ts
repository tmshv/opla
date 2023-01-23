import { Box3, Vector3 } from "three"

// to be sure jest works as expected
describe("jest", () => {
    test("adds 1 + 2 to equal 3", () => {
        expect(1 + 2).toBe(3)
    })
})

describe("three", () => {
    test("no intersection between two adjacent Box3", () => {
        const a = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1))
        const b = new Box3(new Vector3(1, 1, 1), new Vector3(2, 2, 2))
        expect(a.intersectsBox(b)).toBeFalsy()
    })
})

