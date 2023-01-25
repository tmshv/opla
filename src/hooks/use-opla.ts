import { Box3, Line3, Vector3 } from "three"
import { useSnapshot } from "valtio"
import { pairs } from "@/lib/array"
import { state } from "@/state"
import { boxHasArea } from "@/lib/t"

type Edge = [Vector3, Vector3]

/**
* x: row (+ right)
* y: column (+ up)
* z: diagonal (+ screen)
*    .f------b
*  .' |    .'|
* e---+--a'  |
* |   |  |   |
* |  ,g--+---c
* |.'    | .'
* h------d'
*
* faces
    [a, b, c, d, a],
    [a, b, f, e, a],
    [e, f, g, h, e],
    [h, d, c, g, h],
    [e, a, d, h, e],
    [f, b, c, g, g],
bbox
    [a, c],
    [a, f],
    [e, g],
    [h, c],
    [e, d],
    [f, c],
* edges:
*  ab
*  ad
*  ae
*  cd
*  cb
*  cg
*  dh
*  bf
*  fg
*  fe
*  eh
*  gh
* **/
function boxVerticies(x: number, y: number, z: number, width: number, height: number, depth: number): [number, number, number][] {
    return [
        [x + 0.5 * width, y + 0.5 * height, z + 0.5 * depth], // a
        [x + 0.5 * width, y + 0.5 * height, z - 0.5 * depth], // b
        [x + 0.5 * width, y - 0.5 * height, z - 0.5 * depth], // c
        [x + 0.5 * width, y - 0.5 * height, z + 0.5 * depth], // d
        [x - 0.5 * width, y + 0.5 * height, z + 0.5 * depth], // e
        [x - 0.5 * width, y + 0.5 * height, z - 0.5 * depth], // f
        [x - 0.5 * width, y - 0.5 * height, z - 0.5 * depth], // g
        [x - 0.5 * width, y - 0.5 * height, z + 0.5 * depth], // h
    ]
}

function getPlanes(center: Vector3, size: Vector3): Box3[] {
    const planes = []
    let box = new Box3()

    box = new Box3(new Vector3(0, -size.y / 2, -size.z / 2), new Vector3(0, size.y / 2, size.z / 2))
    box.translate(new Vector3(size.x / 2, 0, 0))
    box.translate(center)
    planes.push(box)

    box = new Box3(new Vector3(0, -size.y / 2, -size.z / 2), new Vector3(0, size.y / 2, size.z / 2))
    box.translate(new Vector3(-size.x / 2, 0, 0))
    box.translate(center)
    planes.push(box)

    box = new Box3(new Vector3(-size.x / 2, 0, -size.z / 2), new Vector3(size.x / 2, 0, size.z / 2))
    box.translate(new Vector3(0, -size.y / 2, 0))
    box.translate(center)
    planes.push(box)

    box = new Box3(new Vector3(-size.x / 2, 0, -size.z / 2), new Vector3(size.x / 2, 0, size.z / 2))
    box.translate(new Vector3(0, +size.y / 2, 0))
    box.translate(center)
    planes.push(box)

    box = new Box3(new Vector3(-size.x / 2, -size.y / 2, 0), new Vector3(size.x / 2, size.y / 2, 0))
    box.translate(new Vector3(0, 0, -size.z / 2))
    box.translate(center)
    planes.push(box)

    box = new Box3(new Vector3(-size.x / 2, -size.y / 2, 0), new Vector3(size.x / 2, size.y / 2, 0))
    box.translate(new Vector3(0, 0, size.z / 2))
    box.translate(center)
    planes.push(box)

    return planes
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function box3FromVector3(v: Vector3, size: number): Box3 {
    // const s = new Vector3(size, size, size)
    const min = v.clone()
    min.subScalar(size)
    const max = v.clone()
    max.addScalar(size)
    return new Box3(min, max)
}

/**
* returns two boxes in order [BIGGER, SMALLER]
*/
function sortBox3(a: Box3, b: Box3): [Box3, Box3] {
    if (a.containsBox(b)) {
        return [a, b]
    }
    return [b, a]
}

function vectorToAxes(v: Vector3): [Vector3, Vector3, Vector3] {
    return [
        new Vector3(v.x, 0, 0),
        new Vector3(0, v.y, 0),
        new Vector3(0, 0, v.z),
    ]
}

function vectorToAxes2(v: Vector3): [Vector3, Vector3] {
    const axes = vectorToAxes(v)
    const [a, b, _] = axes.filter(a => a.lengthSq() > 0)
    return [a, b]
}

function box3FromTwoVector3(a: Vector3, b: Vector3): Box3 {
    const box = new Box3()
    box.setFromPoints([a, b])
    return box
}

function box3ToCorners(box: Box3): [Vector3, Vector3, Vector3, Vector3] {
    const [ax, ay] = vectorToAxes2(box.getSize(new Vector3()))
    const a1 = box.min.clone()
    const a2 = box.min.clone()
    a2.add(ax)
    const a3 = box.min.clone()
    a3.add(ay)
    const a4 = box.max.clone()
    return [a1, a2, a4, a3]
}

/* split box A by box B to 9 parts
* required to box A contains box B
*/
function splitTo9(a: Box3, b: Box3): Box3[] {
    const [a1, a2, a3, a4] = box3ToCorners(a)
    const [b1, b2, b3, b4] = box3ToCorners(b)

    // four edges of box A
    const l12 = new Line3(a1, a2)
    const l23 = new Line3(a2, a3)
    const l34 = new Line3(a3, a4)
    const l41 = new Line3(a4, a1)

    const boxes = []

    // boxes.push(box3FromVector3(a1, 0.01))
    // boxes.push(box3FromVector3(b1, 0.01))
    // boxes.push(box3FromVector3(a2, 0.01))
    // boxes.push(box3FromVector3(b2, 0.01))
    // boxes.push(box3FromVector3(a3, 0.01))
    // boxes.push(box3FromVector3(a4, 0.01))
    // boxes.push(box3FromVector3(b3, 0.01))
    // boxes.push(box3FromVector3(b4, 0.01))

    // corners
    boxes.push(box3FromTwoVector3(a1, b1))
    boxes.push(box3FromTwoVector3(a2, b2))
    boxes.push(box3FromTwoVector3(a3, b3))
    boxes.push(box3FromTwoVector3(a4, b4))

    // sides
    boxes.push(box3FromTwoVector3(b1, l12.closestPointToPoint(b2, false, new Vector3())))
    boxes.push(box3FromTwoVector3(b2, l23.closestPointToPoint(b4, false, new Vector3())))
    boxes.push(box3FromTwoVector3(b3, l34.closestPointToPoint(b4, false, new Vector3())))
    boxes.push(box3FromTwoVector3(b4, l41.closestPointToPoint(b1, false, new Vector3())))

    return boxes
}

function cleanNodes(nodes: Vector3[]): Vector3[] {
    const result: Vector3[] = []
    for (const node of nodes) {
        const i = result.findIndex(n => n.equals(node))
        if (i === -1) {
            result.push(node)
        }
    }
    return result
}

function isLinesOverlapping(a: Line3, b: Line3): boolean {
    const aa = new Box3()
    aa.setFromPoints([a.start, a.end])
    const bb = new Box3()
    bb.setFromPoints([b.start, b.end])
    return aa.containsBox(bb)
}

function cleanEdges(edges: Line3[]): Line3[] {
    const sorted = edges.sort((a, b) => {
        const da = a.delta(new Vector3())
        const db = b.delta(new Vector3())
        return da.lengthSq() - db.lengthSq()
    })
    const result: Line3[] = []
    for (const edge of sorted) {
        if (result.length === 0) {
            result.push(edge)
            continue
        }
        // const i = result.findIndex(n => n.equals(edge) || isLinesOverlapping(edge, n))
        const i = result.findIndex(n => isLinesOverlapping(edge, n))
        if (i === -1) {
            result.push(edge)
        } else {
            console.log("line overlap", edge, result[i])
        }
    }
    return result
}

export function useOpla(): [[number, number, number][], Edge[], Box3[]] {
    const { items } = useSnapshot(state)
    let nodes: Vector3[] = []
    for (const box of items) {
        const [x, y, z] = box.position
        const [width, height, depth] = box.size
        const vs = boxVerticies(x, y, z, width, height, depth).map(([x, y, z]) => new Vector3(x, y, z))
        for (const v of vs) {
            const i = nodes.findIndex(node => node.equals(v))
            if (i === -1) {
                nodes.push(v)
            }
        }
    }

    let edges: Line3[] = []
    for (const box of items) {
        const [x, y, z] = box.position
        const [width, height, depth] = box.size
        const [a, b, c, d, e, f, g, h] = boxVerticies(x, y, z, width, height, depth).map(([x, y, z]) => new Vector3(x, y, z))
        const boxEdges = [
            [a, b],
            [a, d],
            [a, e],
            [c, d],
            [c, b],
            [c, g],
            [d, h],
            [b, f],
            [f, g],
            [f, e],
            [e, h],
            [g, h],
        ]
        for (const [start, end] of boxEdges) {
            // const i = nodes.findIndex(node => eq(node, v))
            // if (i === -1) {
            edges.push(new Line3(start, end))
            // }
        }
    }

    // list of all polygons in scene
    // const polygons = items.flatMap(box => {
    //     const [x, y, z] = box.position
    //     const [width, height, depth] = box.size
    //     const [a, b, c, d, e, f, g, h] = boxVerticies(x, y, z, width, height, depth).map(([x, y, z]) => new Vector3(x, y, z))
    //     return [
    //         [a, b, c, d, a],
    //         [a, b, f, e, a],
    //         [e, f, g, h, e],
    //         [h, d, c, g, h],
    //         [e, a, d, h, e],
    //         [f, b, c, g, g],
    //     ]
    // })
    const overlaps = []
    for (const pair of pairs(items)) {
        const [a, b] = pair.map(box => {
            const [w, h, d] = box.size
            const b = new Box3(new Vector3(-w / 2, -h / 2, -d / 2), new Vector3(w / 2, h / 2, d / 2))
            const [x, y, z] = box.position
            const pos = new Vector3(x, y, z)
            b.translate(pos)
            return b
        })

        if (a.intersectsBox(b)) {
            const bb = a.clone().intersect(b)
            const center = bb.getCenter(new Vector3())

            // if size of overlapping shape is match this pattern
            // [X, 0, 0], [0, X, 0], [0, 0, X]
            // means overlapping edge only not a polygon
            if (boxHasArea(bb)) {
                // overlaps.push(box3FromVector3(center, 0.01))

                const { position: positionA, size: sizeA } = pair[0]
                const planesA = getPlanes(new Vector3(...positionA), new Vector3(...sizeA))
                // for(let p of planesA) {
                //     overlaps.push(p)
                // }
                const a = planesA.find(plane => {
                    return plane.containsPoint(center)
                })
                const { position: positionB, size: sizeB } = pair[1]
                const planesB = getPlanes(new Vector3(...positionB), new Vector3(...sizeB))
                // for (let p of planesB) {
                //     overlaps.push(p)
                // }
                const b = planesB.find(plane => {
                    return plane.containsPoint(center)
                })

                if (a && b) {
                    console.log("overlap!")

                    const [bigBox, smallBox] = sortBox3(a, b)
                    const innerBox = smallBox.intersect(bigBox)
                    for (let box of splitTo9(bigBox, innerBox)) {
                        if (!boxHasArea(box)) {
                            continue
                        }

                        overlaps.push(box)

                        try {
                            const [a1, a2, a3, a4] = box3ToCorners(box)
                            nodes.push(a1)
                            nodes.push(a2)
                            nodes.push(a3)
                            nodes.push(a4)

                            // four edges of box A
                            const l12 = new Line3(a1, a2)
                            const l23 = new Line3(a2, a3)
                            const l34 = new Line3(a3, a4)
                            const l41 = new Line3(a4, a1)

                            edges.push(l12)
                            edges.push(l23)
                            edges.push(l34)
                            edges.push(l41)
                        } catch (error) {
                            console.log("fail", box)
                        }
                    }

                    // overlaps.push(a)
                    // overlaps.push(b)
                    // overlaps.push(sortBox3(a, b)[0])
                    // overlaps.push(bb)
                }
            }
        }
    }
    return [
        cleanNodes(nodes).map(v => v.toArray()),
        cleanEdges(edges).map(line => [line.start, line.end]),
        // edges.map(line => [line.start, line.end]),
        overlaps,
    ]
}

