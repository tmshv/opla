import type { OplaGroup } from "@/stores/opla"
import state from "@/stores/opla"

export function explode() {
    const val = state.value.model
    const groupIds = val.scene.filter(id => {
        const obj = val.items[id]
        return obj.type === "group"
    })
    for (const id of groupIds) {
        const group = val.items[id] as OplaGroup
        group.children.forEach(id => {
            const obj = val.items[id]
            obj.position[0] += group.position[0]
            obj.position[1] += group.position[1]
            obj.position[2] += group.position[2]
        })
    }

    val.scene = val.scene.flatMap(id => {
        const obj = val.items[id]
        switch (obj.type) {
            case "box": {
                return [id]
            }
            case "group": {
                return obj.children
            }
            default: {
                throw new Error("Unreachable")
            }
        }
    })

    for (const id of groupIds) {
        delete val.items[id]
    }
}
