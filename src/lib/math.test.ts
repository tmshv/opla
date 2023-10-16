import { lerp } from "./math"

describe("lerp", () => {
    test("should return start for 0", () => {
        expect(lerp(5, 10, 0.5)).toBe(5)
    })

    test("should return end for 1", () => {
        expect(lerp(5, 10, 0.5)).toBe(10)
    })

    test("should return mid for 0.5", () => {
        expect(lerp(5, 10, 0.5)).toBe(7.5)
    })
})
