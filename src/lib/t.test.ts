import { Box3, BoxGeometry, Group, Mesh, Vector3 } from "three"
import { boxHasArea, boxInclusiveIntersect, isIntersects } from "./t"

describe("three", () => {
    test("no intersection between two adjacent Box3", () => {
        // one corner intersects (diagonal)
        // const a = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1))
        // const b = new Box3(new Vector3(1, 1, 1), new Vector3(2, 2, 2))

        // one side intersects
        const a = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1))
        const b = new Box3(new Vector3(1, 0, 0), new Vector3(2, 1, 1))
        expect(boxInclusiveIntersect(a, b)).toBeFalsy()
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

    test("should return false if object has no intersection with group", () => {
        const a = new Mesh(new BoxGeometry(1, 1, 1))
        a.position.set(0, 0, 0)

        const b = new Mesh(new BoxGeometry(1, 1, 1))
        b.position.set(1, 0, 0)

        const c = new Mesh(new BoxGeometry(1, 1, 1))
        c.position.set(0, 1, 0)

        const g = new Group()
        g.add(a)
        g.add(b)
        g.add(c)

        expect(isIntersects(a, g)).toBeFalsy()
    })

    test("should return true if object has intersection with group", () => {
        const a = new Mesh(new BoxGeometry(2, 2, 2))
        a.position.set(0, 0, 0)

        const b = new Mesh(new BoxGeometry(1, 1, 1))
        b.position.set(1, 0, 0)

        const c = new Mesh(new BoxGeometry(1, 1, 1))
        c.position.set(0, 1, 0)

        const g = new Group()
        g.add(a)
        g.add(b)
        g.add(c)

        expect(isIntersects(a, g)).toBeTruthy()
    })

    test("hasArea should return true if box is a plane", () => {
        const box = new Box3(new Vector3(), new Vector3(1, 1, 0))
        expect(boxHasArea(box)).toBeTruthy()
    })

    test("hasArea should return true if box is a volume", () => {
        const box = new Box3(new Vector3(), new Vector3(1, 1, 1))
        expect(boxHasArea(box)).toBeTruthy()
    })

    test("hasArea should return false if box is a point", () => {
        const box = new Box3(new Vector3(), new Vector3())
        expect(boxHasArea(box)).toBeFalsy()
    })

    test("hasArea should return false if box is a line", () => {
        const box = new Box3(new Vector3(), new Vector3(1, 0, 0))
        expect(boxHasArea(box)).toBeFalsy()
    })
})

