import { choise, pairs } from "./array"

describe("array", () => {
    test("should get of the value", () => {
        const result = choise(["a", "b", "c"])
        const status = result === "a" || result === "b" || result === "c"
        expect(status).toBeTruthy()
    })

    test("should get one value", () => {
        const result = choise(["a", "b", "c"], () => 1 / 3)
        expect(result).toBe("b")
    })

    test("should create unique pairs", () => {
        const items = [1, 2, 3, 4, 5]
        expect(pairs(items)).toEqual([
            [1, 2],
            [1, 3],
            [1, 4],
            [1, 5],
            [2, 3],
            [2, 4],
            [2, 5],
            [3, 4],
            [3, 5],
            [4, 5],
        ])
    })
})

