import { Box3, Group, Object3D, Vector3 } from "three"

export function boxInclusiveIntersect(a: Box3, b: Box3): boolean {
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

export function isIntersects(block: Object3D, blocks: Group): boolean {
    // block.updateMatrixWorld()
    const bbox = new Box3()
    bbox.setFromObject(block)

    for (let other of blocks.children) {
        if (block === other) {
            continue
        }
        const o = new Box3()
        o.setFromObject(other)
        if (boxInclusiveIntersect(bbox, o)) {
            return true
        }
    }

    return false
}

export function boxHasArea(box: Box3): boolean {
    const size = box.getSize(new Vector3())
    return size.toArray().filter(x => x !== 0).length >= 2
}

