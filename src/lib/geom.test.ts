import { Box3, Line3, Vector3, Mesh, Group, BoxGeometry, MeshBasicMaterial } from "three"
import { boxToLines, boxToPlanes, boxToVerticies, uniqueVectors, wrapGroup } from "./geom"

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

describe("boxToPlanes", () => {
    test("should create 6 edges from one Box3", () => {
        const box = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6))
        const result = [
            [[4, 2, 3], [4, 5, 6]],
            [[1, 2, 3], [1, 5, 6]],
            [[1, 2, 3], [4, 2, 6]],
            [[1, 5, 3], [4, 5, 6]],
            [[1, 2, 3], [4, 5, 3]],
            [[1, 2, 6], [4, 5, 6]],
        ].map(([minArr, maxArr]) => {
            const min = (new Vector3()).fromArray(minArr)
            const max = (new Vector3()).fromArray(maxArr)
            return new Box3(min, max)
        })
        expect(boxToPlanes(box)).toEqual(result)
    })
})

describe('wrapGroup', () => {
    test('returns a THREE.Group object', () => {
        // Example meshes to test with
        const mesh1 = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 'red' }));
        const mesh2 = new Mesh(new BoxGeometry(2, 2, 2), new MeshBasicMaterial({ color: 'green' }));

        const group = wrapGroup([mesh1, mesh2]);
        expect(group).toBeInstanceOf(Group);
    });

    test('correctly calculates the center of geometry', () => {
        // Example meshes to test with
        const mesh1 = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 'red' }));
        const mesh2 = new Mesh(new BoxGeometry(2, 2, 2), new MeshBasicMaterial({ color: 'green' }));

        const group = wrapGroup([mesh1, mesh2]);
        const expectedCenter = new Vector3(0, 0, 0); // Both meshes have center at origin
        expect(group.position).toEqual(expectedCenter);
    });

    test('updates mesh positions so group is centered', () => {
        // Example meshes to test with
        const mesh1 = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 'red' }));
        const mesh2 = new Mesh(new BoxGeometry(2, 2, 2), new MeshBasicMaterial({ color: 'green' }));

        const group = wrapGroup([mesh1, mesh2]);
        const mesh1Position = new Vector3(-0.5, -0.5, -0.5); // New position after centering
        const mesh2Position = new Vector3(-1, -1, -1); // New position after centering
        expect(mesh1.position).toEqual(mesh1Position);
        expect(mesh2.position).toEqual(mesh2Position);
    });
});
