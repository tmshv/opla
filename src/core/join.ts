import { Vector3 } from "three"
import { unionBoxes } from "@/lib/t"
import { OplaBox, OplaId, state } from "@/stores/opla"
import { Graph } from "@/lib/graph"
import { v4 as uuidv4 } from "uuid"
import { explode } from "./explode"
import { oplaItemToBox3 } from "@/lib/opla-geom"

export function join() {
    explode()

    // take all single boxes from scene
    const boxes = state.scene
        .filter(id => state.items[id].type === "box")
        .map(id => state.items[id] as OplaBox)

    const newScene: OplaId[] = []
    const graph = new Graph<OplaId, OplaBox>()
    for (const box of boxes) {
        graph.addNode(box.id, box)
    }

    for (const a of boxes) {
        for (const b of boxes) {
            // skip self intersection
            if (a.id === b.id) {
                continue
            }
            // skip no intersecion
            const bboxA = oplaItemToBox3(a)
            const bboxB = oplaItemToBox3(b)
            if (!bboxA.intersectsBox(bboxB)) {
                continue
            }
            graph.addEdge(a.id, b.id)
        }
    }

    const islands = graph.findAllIslands()
    for (const island of islands) {
        const children = [...island]

        // add single box back
        if (children.length === 1) {
            newScene.push(children[0])
            continue
        }

        // find center of children
        const groupBbox = unionBoxes(
            children.map(id => oplaItemToBox3(state.items[id] as OplaBox))
        )
        const center = groupBbox.getCenter(new Vector3)
        for (const boxId of children) {
            const box = state.items[boxId] as OplaBox
            const localPosition = new Vector3()
            localPosition.fromArray(box.position)
            localPosition.sub(center)
            box.position = localPosition.toArray()
        }

        const groupId = uuidv4()
        state.items[groupId] = {
            id: groupId,
            type: "group",
            position: center.toArray(),
            children,
        }
        newScene.push(groupId)
    }

    state.scene = newScene
}
