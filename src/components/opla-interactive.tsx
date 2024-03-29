import appState, { Tool } from "@/stores/app"
import type { OplaBox, OplaId } from "@/stores/opla"
import state from "@/stores/opla"
import { useCursor, Bvh } from "@react-three/drei"
import { MeshProps } from "@react-three/fiber"
import { useState } from "react"
import { useSnapshot } from "valtio"

type BoxProps = MeshProps & {
    width: number
    height: number
    depth: number
    color: string
    opacity: number
    visible: boolean
}

const Box: React.FC<BoxProps> = ({ width, height, depth, visible, color, opacity, ...props }) => {
    const [hovered, setHovered] = useState(false)
    useCursor(hovered)

    return (
        <mesh {...props}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <boxGeometry
                args={[width, height, depth]}
            />
            <meshStandardMaterial
                color={color}
                transparent
                opacity={visible ? opacity : 0}
            />
        </mesh>
    )
}

export type BoxGroupProps = {
    onClick: (id: OplaId) => void
    name: string
    id: OplaId
    children: OplaId[]
    highlightColor: string
}

export const BoxGroup: React.FC<BoxGroupProps> = ({ onClick, id, children, name, highlightColor }) => {
    const { value: { model: { items } } } = useSnapshot(state)
    const { target, tool } = useSnapshot(appState)
    const obj = items[id]
    // const ids = items[id].ch
    // // TODO: move this to lib
    // const c = ids.reduce((center, id) => {
    //     const box = boxes[id]
    //     center[0] += box.position[0]
    //     center[1] += box.position[1]
    //     center[2] += box.position[2]
    //     return center
    // }, [0, 0, 0])
    // const center = new Vector3()
    // center.fromArray(c)
    // center.divideScalar(ids.length)
    // const bbox = unionBoxes(ids
    //     .map(id => boxes[id] as OplaBox)
    //     .map(oplaItemToBox3)
    // )
    // const ud = {
    //     bbox,
    //     ids: [...ids],
    // }

    return (
        <group
            name={name}
            position={obj.position}
            onClick={(event) => {
                event.stopPropagation()
                onClick(id)
            }}
        >
            {children.map(id => {
                const box = items[id] as OplaBox
                const [width, height, depth] = box.size
                return (
                    <Box
                        key={box.id}
                        name={box.id}
                        position={box.position}
                        width={width}
                        height={height}
                        depth={depth}
                        visible={(tool === Tool.SELECT && obj.id === target)}
                        color={highlightColor}
                        opacity={0.5}
                    />
                )
            })}
        </group>
    )
}

export type OplaInteractiveProps = {
    name: string
    onClick: (box: OplaId) => void
    highlightColor: string
}

export const OplaInteractive: React.FC<OplaInteractiveProps> = ({ name, onClick, highlightColor }) => {
    const { value: { model: { scene, items } } } = useSnapshot(state)
    const { target, tool } = useSnapshot(appState)

    return (
        <Bvh firstHitOnly>
            <group name={name}>
                {scene.map(id => {
                    const obj = items[id]
                    const visible = tool === Tool.SELECT && obj.id === target
                    switch (obj.type) {
                        case "box": {
                            const [width, height, depth] = obj.size
                            return (
                                <Box
                                    key={id}
                                    name={id}
                                    position={obj.position}
                                    width={width}
                                    height={height}
                                    depth={depth}
                                    visible={visible}
                                    color={highlightColor}
                                    opacity={0.5}
                                    onClick={event => {
                                        // nearest object to camera will receive first click event
                                        // stop propagation to prevent click event for other object behind
                                        event.stopPropagation()
                                        onClick(event.object.name)
                                    }}
                                />
                            )
                        }
                        case "group": {
                            return (
                                <BoxGroup
                                    key={id}
                                    id={id}
                                    name={id}
                                    onClick={onClick}
                                    highlightColor={highlightColor}
                                >
                                    {obj.children as OplaId[]}
                                </BoxGroup>
                            )
                        }
                        default: {
                            throw new Error("Unreachable")
                        }
                    }
                })}
            </group>
        </Bvh>
    )
}
