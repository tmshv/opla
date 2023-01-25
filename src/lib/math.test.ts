import { floor, isInt } from "./math"

describe("math", () => {
    test("isInt true for int", () => {
        expect(isInt(234)).toBeTruthy()
    })

    test("isInt false for float", () => {
        expect(isInt(2.34)).toBeFalsy()
    })

    test("floor as expected for positive number", () => {
        expect(floor(523.234)).toBe(523)
    })

    test("floor closer to 0 negative number", () => {
        expect(floor(-523.234)).toBe(-523)
        expect(Math.floor(-523.234)).toBe(-524)
    })
})

