import { Box3, Vector3 } from "three"

// to be sure jest works as expected
describe("jest", () => {
    test("adds 1 + 2 to equal 3", () => {
        expect(1 + 2).toBe(3)
    })
})

function boxIntersect(a: Box3, b: Box3): boolean {
    // using 6 splitting planes to rule out intersections.
    return a.max.x <= b.min.x
        || a.min.x >= b.max.x
        || a.max.y <= b.min.y
        || a.min.y >= b.max.y
        || a.max.z <= b.min.z
        || a.min.z >= b.max.z
        ? false
        : true
}

describe("three", () => {
    test("no intersection between two adjacent Box3", () => {
        // one corner intersects (diagonal)
        // const a = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1))
        // const b = new Box3(new Vector3(1, 1, 1), new Vector3(2, 2, 2))

        // one side intersects
        const a = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1))
        const b = new Box3(new Vector3(1, 0, 0), new Vector3(2, 1, 1))
        expect(boxIntersect(a, b)).toBeFalsy()
        // expect(a.intersectsBox(b)).toBeFalsy()
    })

    test("create box3 from two Vector3", () => {
        //       this.min.max( box.min );
        // this.max.min( box.max );

        const a = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6))
        // const b = new Box3(new Vector3(4, 5, 6), new Vector3(1, 2, 3))
        //
        const b = new Box3()
        b.setFromPoints([
            new Vector3(4, 5, 6),
            new Vector3(1, 2, 3),
        ])

        expect(a.equals(b)).toBeTruthy()
    })

    test("two Box3 lines overlapping", () => {
        const a = new Box3(new Vector3(1, 2, 3), new Vector3(1, 2, 6))
        const b = new Box3(new Vector3(1, 2, 4), new Vector3(1, 2, 5))
        expect(a.containsBox(b)).toBeTruthy()

        const c = new Box3(
            new Vector3(-0.5, -0.5, -0.5),
            new Vector3(-0.5, -0.5, 0.5),
        )
        const d = new Box3(
            new Vector3(0.5, -0.5, -0.5),
            new Vector3(-0.5, -0.5, -0.5),
        )
        expect(c.containsBox(d)).toBeTruthy()
    })
})

