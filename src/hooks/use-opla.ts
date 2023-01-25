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

function boxToVerticies(box: Box3): Vector3[] {
    const [ax, ay, az] = vectorToAxes(box.getSize(new Vector3()))

    const a1 = box.min.clone()
    const a2 = box.min.clone().add(ax)
    const a3 = box.min.clone().add(ay)
    const a4 = box.max.clone().sub(az)

    const a5 = box.min.clone().add(az)
    const a6 = box.min.clone().add(az).add(ax)
    const a7 = box.min.clone().add(az).add(ay)
    const a8 = box.max.clone()

    return [a1, a2, a4, a3, a5, a6, a7, a8]
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
            // console.log("line overlap", edge, result[i])
        }
    }
    return result
}

function splitLineByVerticies(line: Line3, verticies: Vector3[]): Line3[] {
    const parts: Line3[] = []
    // parts.push(line)
    const vs = verticies
        // take all verticies who can be projected directly on the line
        .filter(v => {
            const parameter = line.closestPointToPointParameter(v, false)
            return parameter > 0 && parameter < 1
        })
        // and than take only whos is lying on the line
        .filter(v => {
            const p = line.closestPointToPoint(v, false, new Vector3())
            // on the line
            if (p.distanceTo(v) === 0) {
                return true
            }

            return false
        })
        // sort verticies starting from start of the line
        .sort((a, b) => {
            const ad = line.start.distanceTo(a)
            const bd = line.start.distanceTo(b)
            return ad - bd
        })
    let controls = [line.start, ...vs]
    controls.push(line.end)

    controls = cleanNodes(controls)

    for (let i = 0; i < controls.length - 1; i++) {
        const j = i + 1
        parts.push(new Line3(controls[i].clone(), controls[j].clone()))
    }

    return parts
}

export function useOpla(): [[number, number, number][], Edge[], Box3[]] {
    const { items } = useSnapshot(state)
    const nodes: Vector3[] = []
    const edges: Line3[] = []
    const overlaps = []

    // transform opla block dto to Box3
    const boxes = items.map(item => {
        const [w, h, d] = item.size
        const b = new Box3(new Vector3(-w / 2, -h / 2, -d / 2), new Vector3(w / 2, h / 2, d / 2))
        const [x, y, z] = item.position
        const pos = new Vector3(x, y, z)
        b.translate(pos)
        return b
    })

    // add corners of all boxes
    for (const box of boxes) {
        for (const v of boxToVerticies(box)) {
            nodes.push(v)
        }
    }

    // add extra nodes and edges
    for (const [aa, bb] of pairs(boxes)) {
        if (aa.intersectsBox(bb)) {
            const intersection = aa.clone().intersect(bb)
            const center = intersection.getCenter(new Vector3())

            // skip intersection by edge or by vertex
            if (boxHasArea(intersection)) {
                // overlaps.push(box3FromVector3(center, 0.01))

                // const { position: positionA, size: sizeA } = a
                const planesA = getPlanes(aa.getCenter(new Vector3()), aa.getSize(new Vector3()))
                // for(let p of planesA) {
                //     overlaps.push(p)
                // }
                const a = planesA.find(plane => {
                    return plane.containsPoint(center)
                })
                // const { position: positionB, size: sizeB } = b
                // const planesB = getPlanes(new Vector3(...positionB), new Vector3(...sizeB))
                const planesB = getPlanes(bb.getCenter(new Vector3()), bb.getSize(new Vector3()))
                // for (let p of planesB) {
                //     overlaps.push(p)
                // }
                const b = planesB.find(plane => {
                    return plane.containsPoint(center)
                })

                if (a && b) {
                    console.log("overlap!")

                    for (let box of splitTo9(a, intersection)) {
                        if (!boxHasArea(box)) {
                            continue
                        }

                        const [a1, a2, a3, a4] = box3ToCorners(box)
                        nodes.push(a1)
                        nodes.push(a2)
                        nodes.push(a3)
                        nodes.push(a4)

                        // four edges of box
                        const l12 = new Line3(a1, a2)
                        const l23 = new Line3(a2, a3)
                        const l34 = new Line3(a3, a4)
                        const l41 = new Line3(a4, a1)

                        edges.push(l12)
                        edges.push(l23)
                        edges.push(l34)
                        edges.push(l41)
                    }

                    for (let box of splitTo9(b, intersection)) {
                        if (!boxHasArea(box)) {
                            continue
                        }

                        const [a1, a2, a3, a4] = box3ToCorners(box)
                        nodes.push(a1)
                        nodes.push(a2)
                        nodes.push(a3)
                        nodes.push(a4)

                        // four edges of box
                        const l12 = new Line3(a1, a2)
                        const l23 = new Line3(a2, a3)
                        const l34 = new Line3(a3, a4)
                        const l41 = new Line3(a4, a1)

                        edges.push(l12)
                        edges.push(l23)
                        edges.push(l34)
                        edges.push(l41)
                    }
                }
            }
        }
    }

    // add edges of all boxes
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
            const edge = new Line3(start, end)
            for (const part of splitLineByVerticies(edge, nodes)) {
                edges.push(part)
            }
        }
    }

    return [
        cleanNodes(nodes).map(v => v.toArray()),
        cleanEdges(edges).map(line => [line.start, line.end]),
        overlaps,
    ]
}

