import { Box3, Line3, Vector3 } from "three"

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
export function boxVerticies(x: number, y: number, z: number, width: number, height: number, depth: number): [number, number, number][] {
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

export function boxToVerticies(box: Box3): Vector3[] {
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

export function boxToPlanes(box: Box3): Box3[] {
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const planes = []

    let plane = new Box3(new Vector3(0, -size.y / 2, -size.z / 2), new Vector3(0, size.y / 2, size.z / 2))
    plane.translate(new Vector3(size.x / 2, 0, 0))
    plane.translate(center)
    planes.push(plane)

    plane = new Box3(new Vector3(0, -size.y / 2, -size.z / 2), new Vector3(0, size.y / 2, size.z / 2))
    plane.translate(new Vector3(-size.x / 2, 0, 0))
    plane.translate(center)
    planes.push(plane)

    plane = new Box3(new Vector3(-size.x / 2, 0, -size.z / 2), new Vector3(size.x / 2, 0, size.z / 2))
    plane.translate(new Vector3(0, -size.y / 2, 0))
    plane.translate(center)
    planes.push(plane)

    plane = new Box3(new Vector3(-size.x / 2, 0, -size.z / 2), new Vector3(size.x / 2, 0, size.z / 2))
    plane.translate(new Vector3(0, +size.y / 2, 0))
    plane.translate(center)
    planes.push(plane)

    plane = new Box3(new Vector3(-size.x / 2, -size.y / 2, 0), new Vector3(size.x / 2, size.y / 2, 0))
    plane.translate(new Vector3(0, 0, -size.z / 2))
    plane.translate(center)
    planes.push(plane)

    plane = new Box3(new Vector3(-size.x / 2, -size.y / 2, 0), new Vector3(size.x / 2, size.y / 2, 0))
    plane.translate(new Vector3(0, 0, size.z / 2))
    plane.translate(center)
    planes.push(plane)

    return planes
}

export function box3FromTwoVector3(a: Vector3, b: Vector3): Box3 {
    const box = new Box3()
    box.setFromPoints([a, b])
    return box
}

export function vectorToBox(v: Vector3, size: number): Box3 {
    const min = v.clone()
    min.subScalar(size)
    const max = v.clone()
    max.addScalar(size)
    return new Box3(min, max)
}

export function vectorToAxes(v: Vector3): [Vector3, Vector3, Vector3] {
    return [
        new Vector3(v.x, 0, 0),
        new Vector3(0, v.y, 0),
        new Vector3(0, 0, v.z),
    ]
}

export function isLinesOverlapping(a: Line3, b: Line3): boolean {
    const aa = new Box3()
    aa.setFromPoints([a.start, a.end])
    const bb = new Box3()
    bb.setFromPoints([b.start, b.end])
    return aa.containsBox(bb)
}

// TODO: reduce complexity
export function uniqueVectors(vs: Vector3[]): Vector3[] {
    if (vs.length === 0) {
        return vs
    }

    return vs.reduce<Vector3[]>((acc, item) => {
        const i = acc.findIndex(n => n.equals(item))
        if (i === -1) {
            acc.push(item)
        }
        return acc
    }, [])
}

export function splitLineByVerticies(line: Line3, verticies: Vector3[]): Line3[] {
    const parts: Line3[] = []
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

