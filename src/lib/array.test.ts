import { choise, pairs, groupBy } from "./array"

describe("array::choise", () => {
    test("should get of the value", () => {
        const result = choise(["a", "b", "c"])
        const status = result === "a" || result === "b" || result === "c"
        expect(status).toBeTruthy()
    })

    test("should get one value", () => {
        const result = choise(["a", "b", "c"], () => 1 / 3)
        expect(result).toBe("b")
    })
})

describe("array::pair", () => {
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

describe("array::groupBy", () => {
    test("should group items", () => {
        const items = [1, 2, 3, 4, 5, 6]
        const result = groupBy(items, i => i % 2)
        const answer = new Map([
            [0, [2, 4, 6]],
            [1, [1, 3, 5]],
        ])
        expect(result).toEqual(answer)
    })
})
