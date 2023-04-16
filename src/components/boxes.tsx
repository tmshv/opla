"use client"

import { useState } from "react"
import { MeshProps } from "@react-three/fiber"
import { useCursor } from "@react-three/drei"
import { useSnapshot } from "valtio"
import { useControls } from "leva"
import { state } from "@/stores/opla"
import appState from "@/stores/app"

type BoxProps = MeshProps & {
    width: number
    height: number
    depth: number
    color: string
    visible: boolean
}

const Box: React.FC<BoxProps> = ({ width, height, depth, visible, color, ...props }) => {
    const { showDebug } = useControls({ showDebug: false })
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

export type BoxesProps = {
    onClick: (box: string) => void
}

export const Boxes: React.FC<BoxesProps> = ({ onClick }) => {
    const { items } = useSnapshot(state)
    const { target } = useSnapshot(appState)
    return (
        <group name="opla">
            {items.map(box => {
                const [width, height, depth] = box.size
                return (
                    <Box
                        key={box.id}
                        name={box.id}
                        position={box.position}
                        width={width}
                        height={height}
                        depth={depth}
                        visible={box.id === target}
                        color={"#aa00aa"}
                        onClick={event => {
                            // nearest object to camera will receive first click event
                            // stop propagation to prevent click event for other object behind
                            event.stopPropagation()

                            onClick(event.object.name)
                        }}
                    />
                )
            })}
        </group>
    )
}
