"use client"

import { oplaItemToBox3 } from "@/lib/opla-geom"
import { unionBoxes } from "@/lib/t"
import appState, { Tool } from "@/stores/app"
import { OplaBox, OplaId, state } from "@/stores/opla"
import { useCursor } from "@react-three/drei"
import { MeshProps } from "@react-three/fiber"
import { useControls } from "leva"
import { useState } from "react"
import { Box3, Vector3 } from "three"
import { useSnapshot } from "valtio"

// export function wrapGroup(objects: Mesh[]): Group {
//     // Create a new group to contain the meshes
//     const group = new Group()

//     // Calculate the total center of all the meshes
//     const center = new Vector3()
//     for (let i = 0; i < objects.length; i++) {
//         // const pos = objects[i].geometry.center()
//         const pos = objects[i].geometry.boundingBox?.getCenter(new Vector3())
//         if (pos) {
//             center.add(pos);
//         }
//     }
//     center.divideScalar(objects.length);

//     // Update the position of each mesh so that it's centered on the new origin
//     for (let i = 0; i < objects.length; i++) {
//         const mesh = objects[i];
//         mesh.position.sub(center);
//         group.add(mesh);
//     }

//     // Return the new group object
//     return group;
// }

type BoxProps = MeshProps & {
    width: number
    height: number
    depth: number
    color: string
    visible: boolean
}

const Box: React.FC<BoxProps> = ({ width, height, depth, visible, color, ...props }) => {
    const { showDebug } = useControls({ showDebug: true })
    const [hovered, setHovered] = useState(false)
    useCursor(hovered)

    const a = showDebug ? 0.2 : 0

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
                opacity={visible ? 0.4 : a}
            />
        </mesh>
    )
}

export type BoxGroupProps = {
    onClick: (id: OplaId) => void
    name: string
    id: OplaId
    children: OplaId[]
}

export const BoxGroup: React.FC<BoxGroupProps> = ({ onClick, id, children, name }) => {
    const { items } = useSnapshot(state)
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
                        color={"#ff0064"}
                    />
                )
            })}
        </group>
    )
}

export type OplaSceneProps = {
    name: string
    onClick: (box: OplaId) => void
}

export const OplaScene: React.FC<OplaSceneProps> = ({ name, onClick }) => {
    const { scene, items } = useSnapshot(state)
    const { target, tool } = useSnapshot(appState)

    return (
        <group name={name}>
            {scene.map(id => {
                const obj = items[id]
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
                                visible={(tool === Tool.SELECT && obj.id === target)}
                                color={"#ff0064"}
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
                                children={obj.children as OplaId[]}
                                onClick={onClick}
                            />
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
