import { OplaBox, OplaObject, V3, state } from "@/stores/opla"
import { useSnapshot } from "valtio"
import { Dimension } from "./dimension"
import { oplaItemToBox3 } from "@/lib/opla-geom"
import { Vector3 } from "three"
import { Fragment } from "react"

function getBounds(obj: OplaObject): V3 {
    const { value: { items } } = state
    switch (obj.type) {
        case "box": {
            const [width, height, depth] = obj.size
            return [width, height, depth]
        }
        case "group": {
            const bbox = obj.children
                .map(id => {
                    return oplaItemToBox3(items[id] as OplaBox)
                })
                .reduce((acc, box) => {
                    return acc.union(box)
                })
            const [width, height, depth] = bbox.getSize(new Vector3())
            return [width, height, depth]
        }
        default: {
            throw new Error("Unreachable")
        }
    }
}

export type OplaDimsProps = {
    name: string
    visible: boolean
}

export const OplaDims: React.FC<OplaDimsProps> = ({ name, visible }) => {
    // TODO move this to props
    const m = 150
    const units = "mm"
    const { value: { scene, items } } = useSnapshot(state)

    return (
        <group name={name} visible={visible}>
            {scene.map(id => {
                const obj = items[id]
                const [x, y, z] = obj.position
                const [width, height, depth] = getBounds(obj as OplaObject)
                return (
                    <Fragment key={id}>
                        <Dimension
                            start={[x - width / 2, y - height / 2, z + depth / 2]}
                            end={[x + width / 2, y - height / 2, z + depth / 2]}
                            ext={[1, 0, 0]}
                            label={`${width * m} ${units}`}
                        />
                        <Dimension
                            start={[x + width / 2, y - height / 2, z + depth / 2]}
                            end={[x + width / 2, y + height / 2, z + depth / 2]}
                            ext={[1, 0, 0]}
                            label={`${height * m} ${units}`}
                        />
                        <Dimension
                            start={[x + width / 2, y - height / 2, z - depth / 2]}
                            end={[x + width / 2, y - height / 2, z + depth / 2]}
                            ext={[1, 0, 0]}
                            label={`${depth * m} ${units}`}
                        />
                    </Fragment>
                )
            })}
        </group>
    )
}
