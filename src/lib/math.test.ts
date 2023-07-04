import { isInt } from "./math"

describe("math", () => {
    test("isInt true for int", () => {
        expect(isInt(234)).toBeTruthy()
    })

    test("isInt false for float", () => {
        expect(isInt(2.34)).toBeFalsy()
    })
})

