import { OplaBox, OplaGroup, OplaId, OplaObjectCollection, V3 } from "@/stores/opla"
import { Vector3, Box3 } from "three"
import { boxInclusiveIntersect } from "./t"

export function oplaItemToBox3(item: OplaBox): Box3 {
    const [w, h, d] = item.size
    const box = new Box3(new Vector3(-w / 2, -h / 2, -d / 2), new Vector3(w / 2, h / 2, d / 2))
    const [x, y, z] = item.position
    const pos = new Vector3(x, y, z)
    box.translate(pos)
    return box
}

export function sizeToBox3(size: V3): Box3 {
    const [w, h, d] = size
    return new Box3(new Vector3(-w / 2, -h / 2, -d / 2), new Vector3(w / 2, h / 2, d / 2))
}

export function flatOplaGroup(group: OplaGroup, items: OplaObjectCollection): OplaBox[] {
    return group.children
        .map(id => {
            const o = items[id] as OplaBox
            const box: OplaBox = {
                ...o,
                position: [...o.position],
                size: [...o.size],
            }
            box.position[0] += group.position[0]
            box.position[1] += group.position[1]
            box.position[2] += group.position[2]
            return box
        })
}

export function hasIntersection(boxes: Box3[], skipItemId: OplaId, scene: OplaId[], items: OplaObjectCollection): boolean {
    for (const otherId of scene) {
        const other = items[otherId]
        if (other.id === skipItemId) {
            continue
        }

        const otherBoxes = other.type === "box"
            ? [other]
            : flatOplaGroup(other, items)
        const otherBboxes = otherBoxes.map(oplaItemToBox3)

        // Cross check for inclusive intersection between two box3
        for (const a of boxes) {
            for (const b of otherBboxes) {
                if (boxInclusiveIntersect(a, b)) {
                    return true
                }
            }
        }
    }

    return false
}
