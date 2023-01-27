import { Box3, Line3, Vector3 } from "three"
import { boxToLines, boxToVerticies, uniqueVectors } from "./geom"

describe("uniqueVectors", () => {
    test("should return same list if it empty", () => {
        const items: Vector3[] = []
        const result = uniqueVectors(items)
        expect(result).toBe(items)
    })
    test("should return only unique vectors", () => {
        const result = uniqueVectors([
            new Vector3(0, 0, 0),
            new Vector3(1, 1, 1),
            new Vector3(0, 1, 0),
            new Vector3(1, 0, 0),
            new Vector3(0, 0, 1),

            new Vector3(0, 0, 0),
            new Vector3(1, 1, 1),
            new Vector3(0, 1, 0),
            new Vector3(1, 0, 0),
            new Vector3(0, 0, 1),
        ])
        expect(result).toEqual([
            new Vector3(0, 0, 0),
            new Vector3(1, 1, 1),
            new Vector3(0, 1, 0),
            new Vector3(1, 0, 0),
            new Vector3(0, 0, 1),
        ])
    })
})

describe("boxToVerticies", () => {
    test("should create 8 verticies in right order", () => {
        const box = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6))
        const result = [
            [4, 5, 6],
            [4, 5, 3],
            [4, 2, 3],
            [4, 2, 6],
            [1, 5, 6],
            [1, 5, 3],
            [1, 2, 3],
            [1, 2, 6],
        ].map(([x, y, z]) => new Vector3(x, y, z))
        expect(boxToVerticies(box)).toEqual(result)
    })
})

describe("boxToLines", () => {
    test("should create 12 lines in right order", () => {
        const box = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6))
        const result = [
            [[4, 5, 6], [4, 5, 3]],
            [[4, 5, 6], [4, 2, 6]],
            [[4, 5, 6], [1, 5, 6]],
            [[4, 2, 3], [4, 2, 6]],
            [[4, 2, 3], [4, 5, 3]],
            [[4, 2, 3], [1, 2, 3]],
            [[4, 2, 6], [1, 2, 6]],
            [[4, 5, 3], [1, 5, 3]],
            [[1, 5, 3], [1, 2, 3]],
            [[1, 5, 3], [1, 5, 6]],
            [[1, 5, 6], [1, 2, 6]],
            [[1, 2, 3], [1, 2, 6]],
        ].map(([s, e]) => {
            const start = (new Vector3()).fromArray(s)
            const end = (new Vector3()).fromArray(e)
            return new Line3(start, end)
        })
        expect(boxToLines(box)).toEqual(result)
    })
})

