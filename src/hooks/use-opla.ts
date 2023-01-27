import { Box3, Line3, Vector3 } from "three"
import { useSnapshot } from "valtio"
import { pairs } from "@/lib/array"
import { OplaBox, state } from "@/state"
import { boxHasArea } from "@/lib/t"
import { boxToPlanes, boxToVerticies, boxVerticies, isLinesOverlapping, uniqueVectors, vectorToAxes } from "@/lib/geom"

type Edge = [Vector3, Vector3]

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

function cleanEdges(edges: Line3[]): Line3[] {
    const result: Line3[] = []
    for (const edge of edges) {
        if (result.length === 0) {
            result.push(edge)
            continue
        }
        const i = result.findIndex(n => isLinesOverlapping(edge, n))
        if (i === -1) {
            result.push(edge)
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

    controls = uniqueVectors(controls)

    for (let i = 0; i < controls.length - 1; i++) {
        const j = i + 1
        parts.push(new Line3(controls[i].clone(), controls[j].clone()))
    }

    return parts
}

function oplaItemToBox3(item: OplaBox) {
    const [w, h, d] = item.size
    const box = new Box3(new Vector3(-w / 2, -h / 2, -d / 2), new Vector3(w / 2, h / 2, d / 2))
    const [x, y, z] = item.position
    const pos = new Vector3(x, y, z)
    box.translate(pos)
    return box
}

function* intersectionsWithArea(boxes: Box3[]) {
    for (const [a, b] of pairs(boxes)) {
        if (!a.intersectsBox(b)) {
            continue
        }
        const intersection = a.clone().intersect(b)

        // skip intersection by edge or by vertex
        if (!boxHasArea(intersection)) {
            continue
        }

        yield [a, b, intersection]
    }
}

export function useOpla(): [[number, number, number][], Edge[], Box3[]] {
    const { items } = useSnapshot(state)
    // transform opla block dto to Box3
    const boxes = (items as OplaBox[]).map(oplaItemToBox3)

    const nodes: Vector3[] = []
    const edges: Line3[] = []
    const overlaps = []

    // add corners of all boxes
    for (const box of boxes) {
        for (const v of boxToVerticies(box)) {
            nodes.push(v)
        }
    }

    const extraPlanes = []
    // add extra nodes and edges
    for (const [aa, bb, intersection] of intersectionsWithArea(boxes)) {
        const center = intersection.getCenter(new Vector3())
        const a = boxToPlanes(aa).find(plane => plane.containsPoint(center))
        const b = boxToPlanes(bb).find(plane => plane.containsPoint(center))
        if (!(a && b)) {
            continue
        }

        console.log("overlap!")

        const planes = [a, b]
        for (const plane of planes) {
            for (let box of splitTo9(plane, intersection)) {
                if (!boxHasArea(box)) {
                    continue
                }

                overlaps.push(box)
                extraPlanes.push(box)

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

    // check intersection between pairs of splits
    // TODO: optimize this
    for (const [a, b, intersection] of intersectionsWithArea(extraPlanes)) {
        const planes = [a, b]
        for (let plane of planes) {
            for (let box of splitTo9(plane, intersection)) {
                if (!boxHasArea(box)) {
                    continue
                }

                overlaps.push(box)

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
        uniqueVectors(nodes).map(v => v.toArray()),
        cleanEdges(edges).map(line => [line.start, line.end]),
        overlaps,
    ]
}

