import { OplaBox, state } from "@/stores/opla"
import { useSnapshot } from "valtio"
import { Dimension } from "./dimension"
import { oplaItemToBox3 } from "@/lib/opla-geom"
import { Vector3 } from "three"

export type OplaDimsProps = {
    name: string
    visible: boolean
}

export const OplaDims: React.FC<OplaDimsProps> = ({ name, visible }) => {
    const { value: { scene, items } } = useSnapshot(state)

    return (
        <group name={name} visible={visible}>
            {/* <Dimension
                start={[1.5, -0.5, -0.5]}
                end={[1.5, -0.5, 1.5]}
                ext={[1, 0, 0]}
                label="300mm"
            /> */}
            {/* <Dimension
                start={[-0.5, -0.5, 2.5]}
                end={[3.5, -0.5, 2.5]}
                //ext={[0, 1, 0]}
                ext={[1, 0, 0]}
                label="600mm"
            /> */}
            {/* <Dimension
                start={[1.5, -0.5, 1.5]}
                end={[1.5, 5.5, 1.5]}
                //ext={[0, 0, 1]}
                ext={[1, 0, 0]}
                label="900mm"
            /> */}

            {scene.map(id => {
                const obj = items[id]
                switch (obj.type) {
                    case "box": {
                        const [width, height, depth] = obj.size
                        const [x, y, z] = obj.position
                        return (
                            <>
                                <Dimension
                                    key={`${id}-x`}
                                    start={[x - width / 2, y - height / 2, z + depth / 2]}
                                    end={[x + width / 2, y - height / 2, z + depth / 2]}
                                    ext={[1, 0, 0]}
                                    label={`${width * 150} mm`}
                                />
                                <Dimension
                                    key={`${id}-y`}
                                    start={[x + width / 2, y - height / 2, z + depth / 2]}
                                    end={[x + width / 2, y + height / 2, z + depth / 2]}
                                    ext={[1, 0, 0]}
                                    label={`${height * 150} mm`}
                                />
                                <Dimension
                                    key={`${id}-z`}
                                    start={[x + width / 2, y - height / 2, z - depth / 2]}
                                    end={[x + width / 2, y - height / 2, z + depth / 2]}
                                    ext={[1, 0, 0]}
                                    label={`${depth * 150} mm`}
                                />
                            </>
                        )
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
                        const [x, y, z] = obj.position
                        return (
                            <>
                                <Dimension
                                    key={`${id}-x`}
                                    start={[x - width / 2, y - height / 2, z + depth / 2]}
                                    end={[x + width / 2, y - height / 2, z + depth / 2]}
                                    ext={[1, 0, 0]}
                                    label={`${width * 150} mm`}
                                />
                                <Dimension
                                    key={`${id}-y`}
                                    start={[x + width / 2, y - height / 2, z + depth / 2]}
                                    end={[x + width / 2, y + height / 2, z + depth / 2]}
                                    ext={[1, 0, 0]}
                                    label={`${height * 150} mm`}
                                />
                                <Dimension
                                    key={`${id}-z`}
                                    start={[x + width / 2, y - height / 2, z - depth / 2]}
                                    end={[x + width / 2, y - height / 2, z + depth / 2]}
                                    ext={[1, 0, 0]}
                                    label={`${depth * 150} mm`}
                                />
                            </>
                        )
                    }
                    default: {
                        throw new Error("Unreachable")
                    }
                }
            })}
        </group>
    )
}
