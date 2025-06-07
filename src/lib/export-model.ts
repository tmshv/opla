import type { Object3D } from "three"
import { Box3, Vector3 } from "three"

type FilterObjectFn = (obj: Object3D) => boolean

const TYPES = new Set([
    "opla-model",
    "opla-node",
    "opla-label",
    "opla-edge",
    "opla-edge-group",
])

/**
 * Filter inner objects by filter
 */
function filterSceneObjects(object: Object3D, filter: FilterObjectFn): void {
    // filter children in reverse order to avoid problems with indicies
    for (let i = object.children.length - 1; i >= 0; i--) {
        const child = object.children[i]

        // recursively filter children
        filterSceneObjects(child, filter)

        // remove if not filered
        if (!filter(child)) {
            object.remove(child)
            continue
        }
    }
}

type Options = {
    move: boolean
    scale: number
}

export function getOplaModel(opla: Object3D, opt: Options): Object3D {
    const model = opla.clone()
    filterSceneObjects(model, obj => {
        return TYPES.has(obj.userData.type)
    })

    // scale model
    model.scale.setScalar(opt.scale)

    // move model
    if (opt.move) {
        const box = new Box3()
        box.setFromObject(model)
        const center = box.getCenter(new Vector3())

        // Move model:
        // - center of the model X, Z = (0, 0)
        // - bottom edge Y = 0
        model.position.set(
            -center.x,
            -box.min.y,
            -center.z,
        )
    }

    // Update world matrix after applying tranformation
    model.updateWorldMatrix(false, true)

    return model
}
