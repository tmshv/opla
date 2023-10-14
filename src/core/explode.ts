import { OplaGroup, state } from "@/stores/opla"

export function explode() {
    const groupIds = state.scene.filter(id => {
        const obj = state.items[id]
        return obj.type === "group"
    })
    for (const id of groupIds) {
        const group = state.items[id] as OplaGroup
        group.children.forEach(id => {
            const obj = state.items[id]
            obj.position[0] += group.position[0]
            obj.position[1] += group.position[1]
            obj.position[2] += group.position[2]
        })
    }

    state.scene = state.scene.flatMap(id => {
        const obj = state.items[id]
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
        delete state.items[id]
    }
}
