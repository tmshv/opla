import { choise } from "./array"

// to be sure jest works as expected
describe("array", () => {
    test("should get one value", () => {
        const result = choise(["a", "b", "c"], () => 1)
        expect(result).toBe("b")
    })
})

