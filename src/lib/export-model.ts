import type { Object3D } from "three"
import { Box3, Group, Vector3 } from "three"

type FilterObjectFn = (obj: Object3D) => boolean

const TYPES = new Set([
    "opla-model",
    "opla-node",
    "opla-label",
    "opla-edge",
    "opla-edge-group",
])

/**
 * Фильтрует объекты в сцене согласно настройкам
 */
function filterSceneObjects(object: Object3D, filter: FilterObjectFn): void {
    // Фильтруем детей в обратном порядке чтобы избежать проблем с индексами
    for (let i = object.children.length - 1; i >= 0; i--) {
        const child = object.children[i]

        // Рекурсивно обрабатываем детей
        filterSceneObjects(child, filter)

        // Применяем пользовательский фильтр
        if (!filter(child)) {
            object.remove(child)
            continue
        }
    }
}

export function getOplaModel(opla: Object3D): Object3D {
    const model = opla.clone()
    filterSceneObjects(model, obj => {
        return TYPES.has(obj.userData.type)
    })

    // Вычисляем bounding box модели
    const box = new Box3()
    box.setFromObject(model)
    const center = box.getCenter(new Vector3())
    // const size = box.getSize(new Vector3())

    // Смещаем модель так, чтобы:
    // - центр по X и Y был в (0, 0)
    // - нижняя грань была на Z = 0
    model.position.set(
        -center.x,
        -box.min.y,
        -center.z,
    )
    // model.scale.setScalar(0.15)

    return model
}
